'use strict'

const BASE64_PREFIX = ':base64:'

function replacer (key, value) {
  const raw = this[key]
  if (Buffer.isBuffer(raw)) return BASE64_PREFIX + raw.toString('base64')
  if (typeof value === 'string' && value[0] === ':') return ':' + value
  return value
}

const reviveString = value => {
  if (value[0] !== ':') return value
  return value.startsWith(BASE64_PREFIX)
    ? Buffer.from(value.substring(BASE64_PREFIX.length), 'base64')
    : value.substring(1)
}

const revive = value => {
  if (typeof value === 'string') return reviveString(value)
  if (value === null || typeof value !== 'object') return value
  const keys = Array.isArray(value) ? null : Object.keys(value)
  const length = keys ? keys.length : value.length
  for (let index = 0; index < length; index++) {
    const key = keys ? keys[index] : index
    const item = value[key]
    const revived = revive(item)
    if (revived !== item) value[key] = revived
  }
  return value
}

const DEFAULTS = {
  serialize: value => JSON.stringify(value, replacer),
  deserialize: text => revive(JSON.parse(text))
}

class Keyv {
  constructor (options = {}) {
    Object.assign(this, {
      ...DEFAULTS,
      store: new Map(),
      ...options
    })

    const generateIterator = iterator =>
      async function * () {
        const now = Date.now()
        const nsPrefix = this.namespace ? `${this.namespace}:` : null
        for await (const [key, raw] of typeof iterator === 'function'
          ? iterator(this.namespace)
          : iterator) {
          const data =
            typeof raw === 'string' ? await this.deserialize(raw) : raw
          if (nsPrefix && !key.startsWith(nsPrefix)) {
            continue
          }

          if (typeof data.expires === 'number' && now > data.expires) {
            this.delete(key)
            continue
          }

          yield [this._getKeyUnprefix(key), data.value]
        }
      }

    // Attach iterators
    if (
      typeof this.store[Symbol.iterator] === 'function' &&
      this.store instanceof Map
    ) {
      this.iterator = generateIterator(this.store)
    } else if (typeof this.store.iterator === 'function') {
      this.iterator = generateIterator(this.store.iterator.bind(this.store))
    }
  }

  _getKeyPrefix (key) {
    return this.namespace
      ? `${this.namespace}:${key}`
      : (key && key.toString()) || key
  }

  _getKeyUnprefix (key) {
    if (!this.namespace) return key
    const index = key.indexOf(':')
    return index === -1 ? key : key.substring(index + 1)
  }

  async get (key, { raw: asRaw = false } = {}) {
    const raw = await this.store.get(this._getKeyPrefix(key))
    if (raw === undefined) return undefined

    const data = typeof raw === 'string' ? await this.deserialize(raw) : raw

    if (typeof data.expires === 'number' && Date.now() > data.expires) {
      this.delete(key)
      return undefined
    }

    return asRaw ? data : data.value
  }

  async has (key) {
    return typeof this.store.has === 'function'
      ? this.store.has(this._getKeyPrefix(key))
      : (await this.store.get(this._getKeyPrefix(key))) !== undefined
  }

  async set (key, value, ttl) {
    if (value === undefined) return false
    if (ttl === undefined) ttl = this.ttl
    if (ttl === 0) ttl = undefined
    const expires = typeof ttl === 'number' ? Date.now() + ttl : null
    const valueSerialized = await this.serialize({ value, expires })
    await this.store.set(this._getKeyPrefix(key), valueSerialized, ttl)
    return true
  }

  async delete (key) {
    return this.store.delete(this._getKeyPrefix(key))
  }

  async clear (options) {
    return this.store.clear(this.namespace, options)
  }
}
module.exports = Keyv
