'use strict'

const fetch = require('isomorphic-fetch')
const { EventEmitter } = require('events')
const fetchJSON = (...args) => fetch(...args).then(x => x.json())

class KeyvCFKV extends EventEmitter {
  constructor (options = {}) {
    super()

    options.headers = Object.assign(
      {
        'X-Auth-Key': options.key,
        'X-Auth-Email': options.email
      },
      options.headers
    )
    options = Object.assign(
      {
        emitErrors: true,
        iteratorSize: 100
      },
      options
    )
    Object.keys(options).forEach(key => (this[key] = options[key]))

    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/storage/kv/namespaces/${options.namespaceId}/values/`
  }

  async get (key) {
    return fetchJSON(this.baseUrl + encodeURIComponent(key), {
      headers: this.headers
    }).then(x => x.result || false)
  }

  async set (key, value, ttl) {
    const searchParams =
      typeof ttl === 'number'
        ? new URLSearchParams({ expiration_ttl: ttl / 1000 })
        : undefined

    return fetchJSON(this.baseUrl + encodeURIComponent(key), {
      headers: this.headers,
      searchParams,
      method: 'PUT',
      body: value
    }).then(x => x.success)
  }

  async delete (key) {
    return fetchJSON(this.baseUrl + encodeURIComponent(key), {
      headers: this.headers,
      method: 'DELETE'
    }).then(x => x.success)
  }

  async clear (namespace) {
    const keys = []
    for await (const key of this.iterator(namespace, true)) {
      keys.push(this.delete(key))
    }
    await Promise.all(keys)
    return true
  }

  async * iterator (namespace, fetchKeysOnly = false) {
    const limit = this.iteratorSize
    const baseUrl = this.baseUrl
    const headers = this.headers
    const get = this.get

    async function * generator (prefix, cursor) {
      const searchParams = new URLSearchParams({
        cursor,
        prefix,
        limit
      })

      const response = await fetchJSON(baseUrl.replace('values/', 'keys'), {
        headers,
        searchParams
      })
      const result = response.result
      cursor = response.result_info && response.result_info.cursor

      if (!result || !result.length) return
      const keys = result.map(x => x.name)
      if (!fetchKeysOnly) {
        for (const i in keys) {
          if (Object.prototype.hasOwnProperty.call(keys, i)) {
            const key = keys[i]
            const value = await get(key)
            yield [key, value]
          }
        }
      } else {
        for (const i in keys) {
          if (Object.prototype.hasOwnProperty.call(keys, i)) {
            const key = keys[i]
            yield key
          }
        }
      }

      if (cursor) {
        yield * generator(prefix, cursor)
      }
    }
    yield * generator(`${namespace ? namespace + ':' : ''}`)
  }
}

module.exports = KeyvCFKV
