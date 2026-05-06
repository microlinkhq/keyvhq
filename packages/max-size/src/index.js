'use strict'

const debug = require('debug-logfmt')('keyv-max-size')

const byteLength = value => {
  if (
    typeof value === 'string' ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    return Buffer.byteLength(value)
  }

  const payload = JSON.stringify(value)
  return payload === undefined ? 0 : Buffer.byteLength(payload)
}

function KeyvMaxSize (keyv, { maxSize, size = byteLength, onSkip } = {}) {
  if (!(this instanceof KeyvMaxSize)) {
    return new KeyvMaxSize(keyv, { maxSize, size, onSkip })
  }

  if (!keyv || !keyv.store || typeof keyv.store.set !== 'function') {
    throw new TypeError('A keyv instance with a writable store is required.')
  }

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    throw new TypeError('`maxSize` must be provided as a positive number.')
  }

  const set = keyv.store.set.bind(keyv.store)

  keyv.store.set = async (key, value, ttl) => {
    const valueSize = await size(value, key)

    if (!Number.isFinite(valueSize) || valueSize < 0) {
      throw new TypeError('`size` function must return a positive number.')
    }

    if (valueSize > maxSize) {
      const context = {
        key,
        ttl,
        value,
        maxSize,
        valueSize,
        namespace: keyv.namespace
      }

      debug('skipped', {
        key,
        ttl,
        maxSize,
        valueSize,
        namespace: keyv.namespace
      })

      if (typeof onSkip === 'function') await onSkip(context)

      return true
    }

    return set(key, value, ttl)
  }

  return keyv
}

module.exports = KeyvMaxSize
module.exports.byteLength = byteLength
