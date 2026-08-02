'use strict'

const Keyv = require('@keyvhq/core')
const mimicFn = require('mimic-fn')

const identity = value => value

function memoize (
  fn,
  keyvOptions,
  {
    key: getKey = identity,
    objectMode = false,
    staleTtl: rawStaleTtl,
    ttl: rawTtl,
    value: getValue = identity
  } = {}
) {
  const keyv = keyvOptions instanceof Keyv ? keyvOptions : new Keyv(keyvOptions)
  const ttl = typeof rawTtl === 'function' ? rawTtl : () => rawTtl
  const staleTtl = typeof rawStaleTtl === 'function'
    ? rawStaleTtl
    : typeof rawStaleTtl === 'number'
      ? () => rawStaleTtl
      : rawStaleTtl

  const inflight = new Map()
  let requests = 0

  /**
   * This can be better. Check:
   * - https://github.com/lukechilds/keyv/issues/36
   *
   * @param {string} key
   * @return {Promise<object>} { expires:number, value:* }
   */
  async function getRaw (key) {
    const raw = await keyv.store.get(keyv._getKeyPrefix(key))
    return typeof raw === 'string' ? keyv.deserialize(raw) : raw
  }

  /**
   * @param {string} key
   * @param {*} value
   * @return {Promise} resolves when updated
   */
  async function updateStoredValue (key, raw) {
    const value = await getValue(raw)
    await keyv.set(key, value, ttl(value))
    return value
  }

  /**
   * A key runs at most one forced and one regular request at a time, so both
   * live in the same slot: a request coalesces with its own lane and can see
   * the request occupying the other one. `order` is when the caller asked,
   * which is what decides whose value the key keeps.
   *
   * @param {string} key
   * @param {boolean} force
   * @return {object} the request occupying the lane
   */
  function acquire (key, force) {
    let slot = inflight.get(key)
    if (slot === undefined) inflight.set(key, (slot = { forced: undefined, regular: undefined }))
    const lane = force ? 'forced' : 'regular'
    const request = {
      order: ++requests,
      rival: () => slot[force ? 'regular' : 'forced'],
      promise: undefined,
      superseded: false,
      value: undefined,
      release () {
        if (slot[lane] !== request) return
        slot[lane] = undefined
        if (slot.forced === undefined && slot.regular === undefined) inflight.delete(key)
      }
    }
    slot[lane] = request
    return request
  }

  /**
   * Persist a refresh result, keeping the value of whoever asked last — being
   * forced does not win a race, it only expires the entry. The older request
   * waits for the newer one and takes the value it stored, so nothing older
   * than what the key already holds can replace it.
   *
   * @param {string} key
   * @param {*} raw
   * @param {object} request
   * @return {Promise<*>}
   */
  async function commitStoredValue (key, raw, request) {
    const rival = request.rival()
    if (rival !== undefined && rival.order > request.order) {
      await rival.promise.catch(() => {})
    }
    if (request.superseded) return request.value
    const value = await updateStoredValue(key, raw)
    const loser = request.rival()
    if (loser !== undefined && loser.order < request.order) {
      Object.assign(loser, { superseded: true, value })
    }
    return value
  }

  /**
   * @return {Promise<*>}
   */
  function memoized (...args) {
    const rawKey = getKey(...args)
    const [key, forceExpiration] = Array.isArray(rawKey) ? rawKey : [rawKey]
    const force = forceExpiration === true

    const running = inflight.get(key)?.[force ? 'forced' : 'regular']
    if (running !== undefined) return running.promise

    const request = acquire(key, force)

    request.promise = getRaw(key).then(async data => {
      const hasValue = data ? data.value !== undefined : false
      const hasExpires = hasValue && typeof data.expires === 'number'
      const ttlValue = hasExpires ? data.expires - Date.now() : undefined
      const staleTtlValue =
        hasExpires && staleTtl !== undefined ? staleTtl(data.value) : false
      const isExpired =
        force || (staleTtlValue === false && hasExpires && ttlValue < 0)
      const isStale = staleTtlValue !== false && ttlValue < staleTtlValue
      const info = { hasValue, key, isExpired, isStale, forceExpiration }
      const done = value => (objectMode ? [value, info] : value)

      if (hasValue && !isExpired && !isStale) {
        request.release()
        return done(data.value)
      }

      // Somebody is already refreshing this key, so its value is about to be
      // as fresh as a second origin call would make it.
      if (isStale && !isExpired && request.rival() !== undefined) {
        request.release()
        return done(data.value)
      }

      const promise = Promise.resolve()
        .then(() => fn(...args))
        .then(value => commitStoredValue(key, value, request))

      if (isStale && !isExpired) {
        promise
          .then(() => request.release())
          .catch(error => {
            request.release()
            info.staleError = error
          })
        return done(data.value)
      }

      try {
        const value = await promise
        request.release()
        return done(value)
      } catch (error) {
        request.release()
        throw error
      }
    }).catch(error => {
      request.release()
      throw error
    })

    return request.promise
  }

  mimicFn(memoized, fn)

  return Object.assign(memoized, { keyv, ttl, staleTtl })
}

module.exports = memoize
