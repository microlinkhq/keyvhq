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
    const match = namespace ? `${namespace}:*` : '*'
    const stream = this.redis.scanStream({ match })
    const keys = []
    const collectKeys = new Transform({
      objectMode: true,
      transform (chunk, _, next) {
        keys.push.apply(keys, chunk)
        next()
      }
    })
    await pipeline(stream, collectKeys)
    if (keys.length > 0) await this.redis.unlink(keys)
  }

  async * iterator (namespace) {
    const scan = this.redis.scan.bind(this.redis)
    const get = this.redis.mget.bind(this.redis)
    async function * iterate (curs, pattern) {
      const [cursor, keys] = await scan(curs, 'MATCH', pattern)
      if (!keys.length) return
      const values = await get(keys)
      for (const i in keys) {
        if (Object.prototype.hasOwnProperty.call(keys, i)) {
          const key = keys[i]
          const value = values[i]
          yield [key, value]
        }
      }

      if (cursor !== '0') {
        yield * iterate(cursor, pattern)
      }
    }

    yield * iterate(0, `${namespace ? namespace + ':' : ''}*`)
  }
}

module.exports = KeyvRedis

module.exports.Redis = Redis
