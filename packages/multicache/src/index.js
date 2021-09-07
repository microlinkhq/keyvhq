const Keyv = require('@keyvhq/core')

class MultiCache {
  constructor (remote = new Keyv(), local = new Keyv(), options) {
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
    if (!res || !this.validator(res, ...args)) {
      res = await this.remote.get(...args)
    }
    return res
  }

  async has (...args) {
    let res = await this.local.has(...args)
    if (!res || !this.validator(res, ...args)) {
      res = await this.remote.has(...args)
    }
    return res
  }

  async set (key, value, ttl) {
    const localRes = this.local.set(key, value, ttl)
    const remoteRes = this.remote.set(key, value, ttl)
    await Promise.all([localRes, remoteRes])
    return true
  }

  async delete (key, options = { localOnly: false }) {
    const localRes = this.local.delete(key)
    const remoteRes = !options.localOnly && this.remote.delete(key)
    await Promise.all([localRes, remoteRes])
    return true
  }

  async clear (options = { localOnly: false }) {
    const localRes = this.local.clear()
    const remoteRes = !options.localOnly && this.remote.clear()
    await Promise.all([localRes, remoteRes])
    return true
  }
}

module.exports = MultiCache
