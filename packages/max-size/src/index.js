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

  if (!keyv || typeof keyv.set !== 'function') {
    throw new TypeError('A store with a `set` method is required.')
  }

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    throw new TypeError('`maxSize` must be provided as a positive number.')
  }

  const set = keyv.set.bind(keyv)

  keyv.set = async (key, value, ttl) => {
    const valueSize = await size(value, key)

    if (!Number.isFinite(valueSize) || valueSize < 0) {
      throw new TypeError('`size` function must return a positive number.')
    }

    if (valueSize > maxSize) {
      debug('skipped', { key, ttl, maxSize, valueSize })
      if (typeof onSkip === 'function') await onSkip({ key, ttl, value, maxSize, valueSize })
      return true
    }

    return set(key, value, ttl)
  }

  return keyv
}

module.exports = KeyvMaxSize
module.exports.byteLength = byteLength
