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

test.serial('iterator and clear treat glob characters in a namespace as literals', async t => {
  const redis = new Redis(redisURI)
  const store = new KeyvRedis(redis)
  const star = new Keyv({ store, namespace: 'a*' })
  const ab = new Keyv({ store, namespace: 'ab' })
  const bracket = new Keyv({ store, namespace: '[ab]' })
  const question = new Keyv({ store, namespace: 'q?' })
  const qx = new Keyv({ store, namespace: 'qx' })
  const slash = new Keyv({ store, namespace: 'a\\b' })

  const entries = async keyv => {
    const result = []
    for await (const entry of keyv.iterator()) result.push(entry)
    return result
  }

  try {
    await star.set('k', 'star')
    await ab.set('k', 'ab')
    await bracket.set('k', 'bracket')
    await question.set('k', 'question')
    await qx.set('k', 'qx')
    await slash.set('k', 'slash')

    t.deepEqual(await entries(star), [['k', 'star']])
    t.deepEqual(await entries(bracket), [['k', 'bracket']])
    t.deepEqual(await entries(question), [['k', 'question']])
    t.deepEqual(await entries(slash), [['k', 'slash']])

    await star.clear()
    t.is(await star.get('k'), undefined)
    t.is(await ab.get('k'), 'ab')
    await question.clear()
    t.is(await question.get('k'), undefined)
    t.is(await qx.get('k'), 'qx')
    await bracket.clear()
    t.is(await bracket.get('k'), undefined)
    await slash.clear()
    t.is(await slash.get('k'), undefined)
  } finally {
    await redis.del('a*:k', 'ab:k', '[ab]:k', 'q?:k', 'qx:k', 'a\\b:k')
    redis.disconnect()
  }
})

test.serial('iterator skips a key removed before its value is read', async t => {
  const redis = new Redis(redisURI)
  const store = new KeyvRedis(redis)
  const keyv = new Keyv({ store, namespace: 'gone' })

  try {
    await keyv.set('b', 'b')
    redis.scan = async () => ['0', ['gone:missing', 'gone:b']]
    const entries = []
    for await (const entry of keyv.iterator()) entries.push(entry)
    t.deepEqual(entries, [['b', 'b']])
  } finally {
    await redis.del('gone:b')
    redis.disconnect()
  }
})

test.after.always(async () => {
  const keyv = new Keyv({ store: store() })
  await keyv.clear()
})
