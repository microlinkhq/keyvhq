'use strict'

const EventEmitter = require('events')
const pEvent = require('p-event')
const Redis = require('ioredis')

const normalizeOptions = (...args) =>
  Object.assign({ emitErrors: true }, ...args)

const normalizeArguments = (input, options) => {
  if (input instanceof Redis) return [input, normalizeOptions(options)]
  const { uri, ...opts } = Object.assign(
    typeof input === 'string' ? { uri: input } : input,
    options
  )
  const normalizedOpts = normalizeOptions(opts)
  return [new Redis(uri, normalizedOpts), normalizedOpts]
}

class KeyvRedis extends EventEmitter {
  constructor (uri, options) {
    super()

    const [redis, { emitErrors }] = normalizeArguments(uri, options)

    this.redis = redis

    if (emitErrors) {
      this.redis.on('error', error => {
        this.emit('error', error)
      })
    }
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
    stream.on('data', matchedKeys => keys.push(...matchedKeys))
    await pEvent(stream, 'end')
    if (keys.length > 0) {
      await this.redis.unlink(keys)
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
