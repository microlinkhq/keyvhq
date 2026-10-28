'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const Redis = require('ioredis')
const test = require('ava')

const KeyvRedis = require('..')

const { REDIS_HOST = 'localhost' } = process.env
const redisURI = `redis://${REDIS_HOST}`

const store = () => new KeyvRedis(redisURI)
keyvTestSuite(test, Keyv, store)

test('reuse a redis instance', async t => {
  const redis = new Redis(redisURI)
  redis.singleton = true

  const store = new KeyvRedis(redis)

  const keyvOne = new Keyv({ store, namespace: 'one' })

  t.true(store.redis.singleton)

  await keyvOne.set('foo', 'bar')

  t.is(await keyvOne.get('foo'), 'bar')
  t.is((await keyvOne.deserialize(await redis.get('one:foo'))).value, 'bar')
  t.true(keyvOne.store.redis.singleton)

  const keyvTwo = new Keyv({ store, namespace: 'two' })
  await keyvTwo.set('foo', 'bar')

  t.is(await keyvTwo.get('foo'), 'bar')
  t.is((await keyvTwo.deserialize(await redis.get('two:foo'))).value, 'bar')
  t.true(keyvTwo.store.redis.singleton)
})

test.serial('iterator yields every key when SCAN returns empty pages', async t => {
  const redis = new Redis(redisURI)
  const store = new KeyvRedis(redis)
  const noise = new Keyv({ store, namespace: 'noise' })
  const sparse = new Keyv({ store, namespace: 'sparse' })

  const noiseKeys = Array.from({ length: 1000 }, (_, index) => `noise:${index}`)
  const keys = ['a', 'b', 'c', 'd', 'e']

  try {
    await redis.mset(noiseKeys.flatMap(key => [key, 'x']))
    await Promise.all(keys.map(key => sparse.set(key, key)))
    const entries = []
    for await (const entry of sparse.iterator()) entries.push(entry)
    t.deepEqual(entries.sort(), keys.map(key => [key, key]))
  } finally {
    await Promise.all([noise.clear(), sparse.clear()])
    redis.disconnect()
  }
})

test.after.always(async () => {
  const keyv = new Keyv({ store: store() })
  await keyv.clear()
})
