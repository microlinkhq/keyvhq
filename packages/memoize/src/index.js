'use strict'

const Keyv = require('@keyvhq/core')
const mimicFn = require('mimic-fn')
const pAny = require('p-any')

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
  const staleTtl =
    typeof rawStaleTtl === 'function'
      ? rawStaleTtl
      : typeof rawStaleTtl === 'number'
        ? () => rawStaleTtl
        : undefined
  const pending = Object.create(null)

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
   * @return {Promise<*>} value
   * @throws if not found
   */
  function getStoredValue (key) {
    return getRaw(key).then(data => {
      if (!data || data.value === undefined) {
        throw new Error('Not found')
      }
      return data.value
    })
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
   * @return {Promise<*>}
   */
  function memoized (...args) {
    const key = getKey(...args)

    if (pending[key] !== undefined) {
      return pAny([getStoredValue(key), pending[key]])
    }

    pending[key] = getRaw(key).then(async data => {
      const hasValue = data ? data.value !== undefined : false
      const hasExpires = hasValue && typeof data.expires === 'number'
      const ttlValue = hasExpires ? data.expires - Date.now() : undefined
      const isExpired = staleTtl === undefined && hasExpires && ttlValue < 0
      const isStale =
        staleTtl !== undefined && hasExpires && ttlValue < staleTtl(data.value)
      const info = { hasValue, key, isExpired, isStale }
      const done = value => (objectMode ? [value, info] : value)

      if (hasValue && !isExpired && !isStale) {
        pending[key] = undefined
        return done(data.value)
      }

      const promise = Promise.resolve(fn(...args)).then(value =>
        updateStoredValue(key, value)
      )

      if (isStale) {
        promise
          .then(() => (pending[key] = undefined))
          .catch(error => (info.staleError = error))
        return done(data.value)
      }

      try {
        const value = await promise
        pending[key] = undefined
        return done(value)
      } catch (error) {
        pending[key] = undefined
        throw error
      }
    })

    return pending[key]
  }

  mimicFn(memoized, fn)

  return Object.assign(memoized, { keyv })
}

module.exports = memoize
