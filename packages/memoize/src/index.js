'use strict'

const Keyv = require('@keyvhq/core')
const mimicFn = require('mimic-fn')
const pAny = require('p-any')

const identity = value => value

function memoize (
  fn,
  keyvOptions,
  { resolver = identity, ttl: rawTtl, stale: rawStale } = {}
) {
  const keyv = keyvOptions instanceof Keyv ? keyvOptions : new Keyv(keyvOptions)
  const pending = {}
  const ttl = typeof rawTtl === 'function' ? rawTtl : () => rawTtl
  const stale = typeof rawStale === 'number' ? rawStale : undefined

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
   * @param {*[]} args
   * @return {Promise<*>} value
   */
  async function refreshValue (key, args) {
    return updateStoredValue(key, await fn(...args))
  }

  /**
   * @param {string} key
   * @param {*} value
   * @return {Promise} resolves when updated
   */
  async function updateStoredValue (key, value) {
    await keyv.set(key, value, ttl(value))
    return value
  }

  /**
   * @return {Promise<*>}
   */
  function memoized (...args) {
    const key = resolver(...args)

    if (pending[key] !== undefined) {
      return pAny([getStoredValue(key), pending[key]])
    }

    pending[key] = getRaw(key).then(async data => {
      const hasValue = data ? data.value !== undefined : false
      const hasExpires = hasValue && typeof data.expires === 'number'
      const ttlValue = hasExpires ? data.expires - Date.now() : undefined
      const isExpired = stale === undefined && hasExpires && ttlValue < 0
      const isStale = stale !== undefined && hasExpires && ttlValue < stale

      if (hasValue && !isExpired && !isStale) {
        pending[key] = undefined
        return data.value
      }

      if (isExpired) keyv.delete(key)
      const promise = refreshValue(key, args)

      if (isStale) {
        promise
          .then(value => keyv.emit('memoize.fresh.value', value))
          .catch(error => keyv.emit('memoize.fresh.error', error))
        return data.value
      }

      try {
        const value = await promise
        pending[key] = undefined
        return value
      } catch (error) {
        pending[key] = undefined
        throw error
      }
    })

    return pending[key]
  }

  mimicFn(memoized, fn)

  return Object.assign(memoized, { keyv, resolver, ttl })
}

module.exports = memoize
