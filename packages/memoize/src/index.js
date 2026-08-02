'use strict'

const NullProtoObj = require('null-prototype-object')
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

  const pending = new NullProtoObj()
  const refreshes = new Map()

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
   * Register an in-flight refresh so a force refresh landing meanwhile can
   * supersede it. The entry disappears once no refresh is left for the key.
   *
   * @param {string} key
   * @return {{ superseded: boolean, release: function }}
   */
  function trackRefresh (key) {
    if (!refreshes.has(key)) refreshes.set(key, new Set())
    const siblings = refreshes.get(key)
    const refresh = {
      superseded: false,
      release () {
        siblings.delete(refresh)
        if (siblings.size === 0) refreshes.delete(key)
      }
    }
    siblings.add(refresh)
    return refresh
  }

  /**
   * @param {string} key
   * @param {object} refresh the force refresh that just wrote
   * @return {void}
   */
  function supersedeRefreshes (key, refresh) {
    for (const sibling of refreshes.get(key) ?? []) {
      if (sibling !== refresh) sibling.superseded = true
    }
  }

  /**
   * Persist a refresh result. A force refresh always writes and then supersedes
   * every refresh already in flight. A non-force refresh waits for any force
   * refresh still running, then writes only if it was not superseded — the
   * forced value stays the one in storage and the one returned.
   *
   * @param {string} key
   * @param {*} raw
   * @param {{ force: boolean, forcePendingKey: string, refresh: object }} meta
   * @return {Promise<*>}
   */
  async function commitStoredValue (key, raw, { force, forcePendingKey, refresh }) {
    if (force) {
      const value = await updateStoredValue(key, raw)
      supersedeRefreshes(key, refresh)
      return value
    }
    const forcePending = pending[forcePendingKey]
    if (forcePending !== undefined) await forcePending.catch(() => {})
    if (!refresh.superseded) return updateStoredValue(key, raw)
    const current = await getRaw(key)
    return current && current.value !== undefined
      ? current.value
      : getValue(raw)
  }

  /**
   * @return {Promise<*>}
   */
  function memoized (...args) {
    const rawKey = getKey(...args)
    const [key, forceExpiration] = Array.isArray(rawKey) ? rawKey : [rawKey]
    const pendingKey = `${key}:${forceExpiration === true}`
    const forcePendingKey = `${key}:true`

    if (pending[pendingKey] !== undefined) return pending[pendingKey]

    pending[pendingKey] = getRaw(key).then(async data => {
      const hasValue = data ? data.value !== undefined : false
      const hasExpires = hasValue && typeof data.expires === 'number'
      const ttlValue = hasExpires ? data.expires - Date.now() : undefined
      const staleTtlValue =
        hasExpires && staleTtl !== undefined ? staleTtl(data.value) : false
      const isExpired =
        forceExpiration === true
          ? forceExpiration
          : staleTtlValue === false && hasExpires && ttlValue < 0
      const isStale = staleTtlValue !== false && ttlValue < staleTtlValue
      const info = { hasValue, key, isExpired, isStale, forceExpiration }
      const done = value => (objectMode ? [value, info] : value)

      if (hasValue && !isExpired && !isStale) {
        pending[pendingKey] = undefined
        return done(data.value)
      }

      // A force refresh already in flight is the authoritative refresh for this
      // key — do not start a competing stale background write that can land later.
      if (isStale && !isExpired && pending[forcePendingKey] !== undefined) {
        pending[pendingKey] = undefined
        return done(data.value)
      }

      const refresh = trackRefresh(key)
      const promise = Promise.resolve()
        .then(() => fn(...args))
        .then(value =>
          commitStoredValue(key, value, {
            force: forceExpiration === true,
            forcePendingKey,
            refresh
          })
        )
        .finally(() => refresh.release())

      if (isStale && !isExpired) {
        promise
          .then(() => (pending[pendingKey] = undefined))
          .catch(error => {
            pending[pendingKey] = undefined
            info.staleError = error
          })
        return done(data.value)
      }

      try {
        const value = await promise
        pending[pendingKey] = undefined
        return done(value)
      } catch (error) {
        pending[pendingKey] = undefined
        throw error
      }
    }).catch(error => {
      pending[pendingKey] = undefined
      throw error
    })

    return pending[pendingKey]
  }

  mimicFn(memoized, fn)

  return Object.assign(memoized, { keyv, ttl, staleTtl })
}

module.exports = memoize
