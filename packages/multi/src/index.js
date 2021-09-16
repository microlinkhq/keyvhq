'use strict'

const Keyv = require('@keyvhq/core')

class MultiCache {
  constructor ({ remote = new Keyv(), local = new Keyv(), ...options }) {
    const normalizedOptions = Object.assign(
      {
        validator: () => true
      },
      options
    )
    this.remote = remote
    this.local = local

    Object.keys(normalizedOptions).forEach(
      key => (this[key] = normalizedOptions[key])
    )
  }

  async get (...args) {
    let res = await this.local.get(...args)

    if (res === undefined || !this.validator(res, ...args)) {
      const key = this.remote._getKeyPrefix(...args)

      const raw = await this.remote.store.get(key)
      const data = typeof raw === 'string' ? this.remote.deserialize(raw) : raw

      const hasValue = data ? data.value !== undefined : false
      const isFresh =
        hasValue && typeof data.expires === 'number'
          ? Date.now() <= data.expires
          : true

      if (hasValue && isFresh) {
        res = data.value
        await this.local.set(
          this.remote._getKeyUnprefix(key),
          data.value,
          data.expires
        )
      }
    }

    return res
  }

  async has (...args) {
    let res = await this.local.has(...args)
    if (res === false || !this.validator(res, ...args)) {
      res = await this.remote.has(...args)
    }
    return res
  }

  async set (...args) {
    await Promise.all(
      ['local', 'remote'].map(store => this[store].set(...args))
    )
    return true
  }

  async delete (key, { localOnly = false } = {}) {
    await Promise.all(
      ['local', !localOnly && 'remote']
        .filter(Boolean)
        .map(store => this[store].delete(key))
    )

    return true
  }

  async clear ({ localOnly = false } = {}) {
    await Promise.all(
      ['local', !localOnly && 'remote']
        .filter(Boolean)
        .map(store => this[store].clear())
    )

    return true
  }
}

module.exports = MultiCache
