'use strict'

const BASE64_PREFIX = ':base64:'

class Base64 {
  constructor (buffer) {
    this.text = BASE64_PREFIX + buffer.toString('base64')
  }

  toJSON () {
    return this.text
  }
}

// Copies are invisible to JSON.stringify's cycle check: a nested reference
// still points at the original object, so a cycle would be copied until the
// stack overflows. `seen` returns the copy already built for that object.
let seen = null

const withBase64Children = value => {
  if (seen !== null) {
    const cached = seen.get(value)
    if (cached !== undefined) return cached
  }
  let copy
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      if (!Buffer.isBuffer(value[index])) continue
      copy ??= value.slice()
      copy[index] = new Base64(value[index])
    }
  } else {
    for (const key in value) {
      if (!Object.hasOwn(value, key) || !Buffer.isBuffer(value[key])) continue
      copy ??= { ...value }
      copy[key] = new Base64(value[key])
    }
  }
  if (copy !== undefined) {
    seen ??= new WeakMap()
    seen.set(value, copy)
  }
  return copy ?? value
}

function replacer (key, value) {
  if (value instanceof String) value = value.valueOf()
  if (typeof value === 'string') {
    if (value[0] !== ':' || this[key] instanceof Base64) return value
    return ':' + value
  }
  if (value !== null && typeof value === 'object') return withBase64Children(value)
  return value
}

const serialize = value => {
  const previous = seen
  seen = null
  try {
    return JSON.stringify(
      Buffer.isBuffer(value) ? new Base64(value) : value,
      replacer
    )
  } finally {
    seen = previous
  }
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
    value[key] = revive(value[key])
  }
  return value
}

const DEFAULTS = {
  serialize,
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
            // `key` is already stored with its prefix, and delete() adds one.
            await this.delete(this._getKeyUnprefix(key))
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
    const prefix = `${this.namespace}:`
    return key.startsWith(prefix) ? key.slice(prefix.length) : key
  }

  async get (key, { raw: asRaw = false } = {}) {
    const raw = await this.store.get(this._getKeyPrefix(key))
    if (raw === undefined) return undefined

    const data = typeof raw === 'string' ? await this.deserialize(raw) : raw

    if (typeof data.expires === 'number' && Date.now() > data.expires) {
      await this.delete(key)
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
