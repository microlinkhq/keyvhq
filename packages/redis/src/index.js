'use strict'

const Redis = require('ioredis')

const { promisify } = require('util')
const stream = require('stream')

const { Transform } = stream

const pipeline = promisify(stream.pipeline)

const normalizeArguments = (input, options) => {
  if (input instanceof Redis) return input
  const { uri, emitErrors, ...opts } = Object.assign(
    typeof input === 'string' ? { uri: input } : input,
    options
  )
  return new Redis(uri, opts)
}

class KeyvRedis {
  constructor (uri, options = {}) {
    this.redis = normalizeArguments(uri, options)
    this.emitErrors = options.emitErrors !== false
  }

  async get (key) {
    try {
      const value = await this.redis.get(key)
      return value === null ? undefined : value
    } catch (error) {
      if (this.emitErrors) throw error
      return undefined
    }
  }

  async set (key, value, ttl) {
    try {
      return typeof ttl === 'number'
        ? await this.redis.set(key, value, 'PX', ttl)
        : await this.redis.set(key, value)
    } catch (error) {
      if (this.emitErrors) throw error
      return undefined
    }
  }

  async delete (key) {
    try {
      const result = await this.redis.unlink(key)
      return result > 0
    } catch (error) {
      if (this.emitErrors) throw error
      return false
    }
  }

  async clear (namespace) {
    try {
      const match = namespace ? `${namespace}:*` : '*'
      const stream = this.redis.scanStream({ match })
      const unlinkKeys = new Transform({
        objectMode: true,
        transform: (keys, _, next) =>
          keys.length > 0 ? this.redis.unlink(keys).then(() => next()) : next()
      })
      await promisify(pipeline)(stream, unlinkKeys)
    } catch (error) {
      if (this.emitErrors) throw error
    }
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
