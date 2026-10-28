'use strict'

const Redis = require('ioredis')

const { promisify } = require('util')
const stream = require('stream')

const { Transform } = stream

const pipeline = promisify(stream.pipeline)

const normalizeArguments = (input, options) => {
  if (input instanceof Redis) return input
  const { uri, ...opts } = Object.assign(
    typeof input === 'string' ? { uri: input } : input,
    options
  )
  return new Redis(uri, opts)
}

// SCAN MATCH is a glob. Escape so the namespace is a literal prefix.
const matchPattern = namespace => {
  if (!namespace) return '*'
  return `${namespace.replace(/[\\*?[]/g, '\\$&')}:*`
}

class KeyvRedis {
  constructor (uri, options) {
    const redis = normalizeArguments(uri, options)
    this.redis = redis
  }

  async get (key) {
    const value = await this.redis.get(key)
    return value === null ? undefined : value
  }

  async set (key, value, ttl) {
    return typeof ttl === 'number'
      ? this.redis.set(key, value, 'PX', ttl)
      : this.redis.set(key, value)
  }

  async delete (key) {
    const result = await this.redis.unlink(key)
    return result > 0
  }

  async clear (namespace) {
    const stream = this.redis.scanStream({ match: matchPattern(namespace) })
    const unlinkKeys = new Transform({
      objectMode: true,
      transform: (keys, _, next) => keys.length > 0 ? this.redis.unlink(keys).then(() => next()) : next()
    })
    await promisify(pipeline)(stream, unlinkKeys)
  }

  async * iterator (namespace) {
    const pattern = matchPattern(namespace)
    let cursor = '0'
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern)
      cursor = nextCursor
      if (keys.length > 0) {
        const values = await this.redis.mget(keys)
        for (let i = 0; i < keys.length; i++) {
          // A key deleted between SCAN and MGET comes back as null.
          if (values[i] !== null) yield [keys[i], values[i]]
        }
      }
    } while (cursor !== '0')
  }
}

module.exports = KeyvRedis

module.exports.Redis = Redis
