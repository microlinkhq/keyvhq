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
      res = await this.remote.get(...args)
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

  async set (key, value, ttl) {
    await Promise.all(
      ['local', 'remote'].map(store => this[store].set(key, value, ttl))
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
