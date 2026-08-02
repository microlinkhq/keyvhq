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
   * live in the same slot: a request coalesces with its own lane, waits on the
   * other one, and is superseded by it.
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
      slot,
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
   * Persist a refresh result. A forced refresh writes and then supersedes the
   * regular refresh in flight, handing it the value it just stored. A regular
   * refresh waits for a forced one to finish before deciding, so the forced
   * value is what stays in storage and what both callers get back.
   *
   * @param {string} key
   * @param {*} raw
   * @param {object} request
   * @param {boolean} force
   * @return {Promise<*>}
   */
  async function commitStoredValue (key, raw, request, force) {
    if (force) {
      const value = await updateStoredValue(key, raw)
      const regular = request.slot.regular
      if (regular !== undefined) Object.assign(regular, { superseded: true, value })
      return value
    }
    const forced = request.slot.forced
    if (forced !== undefined) await forced.promise.catch(() => {})
    return request.superseded ? request.value : updateStoredValue(key, raw)
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

      // A forced refresh in flight is the authoritative refresh for this key —
      // do not start a competing stale write that can land later.
      if (isStale && !isExpired && request.slot.forced !== undefined) {
        request.release()
        return done(data.value)
      }

      const promise = Promise.resolve()
        .then(() => fn(...args))
        .then(value => commitStoredValue(key, value, request, force))

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
