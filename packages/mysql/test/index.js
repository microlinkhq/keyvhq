'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvMysql = require('..')

const dbUrl = process.env.MYSQL_URL || 'mysql://root:root@127.0.0.1/keyv_test'
const store = () => new KeyvMysql(dbUrl)
keyvTestSuite(test, Keyv, store)

const specialKeys = [
  "'",
  '\\',
  "\\'",
  '%',
  '_',
  'a\\nb',
  "x\\') OR 1=1 -- ",
  '?',
  'a\nb',
  'a\0b',
  'a\\0b',
  'a\\Zb',
  'a\tb'
]

test.serial('keys with quotes, backslashes and wildcards are stored verbatim', async t => {
  const keyv = new Keyv({ store: new KeyvMysql(dbUrl, { table: 'keyv_special_keys' }) })
  await keyv.clear()

  for (const key of specialKeys) await keyv.set(key, key)
  for (const key of specialKeys) t.is(await keyv.get(key), key)

  const keys = []
  for await (const [key] of keyv.iterator()) keys.push(key)
  t.deepEqual(keys.sort(), [...specialKeys].sort())

  for (const key of specialKeys) t.true(await keyv.delete(key))
  await keyv.clear()
})

test.serial('a key cannot inject SQL into get or delete', async t => {
  const keyv = new Keyv({ store: new KeyvMysql(dbUrl, { table: 'keyv_injection' }) })
  await keyv.clear()
  await keyv.set('secret', 'value')

  const injection = "nope\\') OR 1=1 -- "
  t.is(await keyv.get(injection), undefined)
  t.false(await keyv.delete(injection))
  t.is(await keyv.get('secret'), 'value')
  await keyv.clear()
})

test.serial('a store accepts keys that are not strings', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_number_keys' })
  await store.clear()
  await store.set(5, 'five')
  t.is(await store.get(5), 'five')
  t.true(await store.delete(5))
})

test.serial('string objects are escaped like strings', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_string_objects' })
  await store.clear()
  await store.set('secret', 'value')

  const injection = Object("nope\\') OR 1=1 -- ")
  t.is(await store.get(injection), undefined)
  t.false(await store.delete(injection))
  t.is(await store.get('secret'), 'value')

  await store.set('safe', injection)
  t.is(await store.get('safe'), String(injection))
  t.is(await store.get('secret'), 'value')

  const key = Object('a\\b')
  await store.set(key, key)
  t.is(await store.get(key), 'a\\b')
  t.true(await store.delete(key))
  await store.clear()
})

test.serial('a numeric namespace is cleared literally', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_numeric_namespace' })
  const numeric = new Keyv({ store, namespace: 1 })
  const lookalike = new Keyv({ store, namespace: '1x' })
  await store.clear()
  await numeric.set('k', 'one')
  await lookalike.set('k', 'other')
  await numeric.clear()
  t.is(await numeric.get('k'), undefined)
  t.is(await lookalike.get('k'), 'other')
  await store.clear()
})

test.serial('clear and iterator match the namespace literally', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_special_namespaces' })
  const namespaces = ['a\\b', 'ab', 'x\\', 'x', 'n%', 'nX', 'u_', 'uX']
  const keyvs = Object.fromEntries(namespaces.map(namespace => [namespace, new Keyv({ store, namespace })]))
  await store.clear()

  for (const namespace of namespaces) await keyvs[namespace].set('k', namespace)

  for (const namespace of namespaces) {
    const entries = []
    for await (const entry of keyvs[namespace].iterator()) entries.push(entry)
    t.deepEqual(entries, [['k', namespace]], `iterator(${namespace})`)

    const storedKeys = []
    for await (const [key] of store.iterator(namespace)) storedKeys.push(key)
    t.deepEqual(storedKeys, [`${namespace}:k`], `store.iterator(${namespace})`)
  }

  for (const namespace of ['a\\b', 'x\\', 'n%', 'u_']) await keyvs[namespace].clear()

  for (const namespace of namespaces) {
    const expected = ['ab', 'x', 'nX', 'uX'].includes(namespace) ? namespace : undefined
    t.is(await keyvs[namespace].get('k'), expected, `get after clear (${namespace})`)
  }
  await store.clear()
})

test.serial('values sql-ts quotes cannot inject', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_quoted_values' })
  await store.clear()
  await store.set('secret', 'value')

  const injection = "nope\\') OR 1=1 -- "
  const evil = { toString () { return injection } }
  const plain = { a: injection }
  const list = [injection]
  const nested = [{ toString () { return injection } }]

  t.is(await store.get(evil), undefined)
  t.false(await store.delete(evil))
  t.is(await store.get(plain), undefined)
  t.false(await store.delete(plain))
  t.is(await store.get(list), undefined)
  t.false(await store.delete(list))
  t.is(await store.get(nested), undefined)
  t.false(await store.delete(nested))
  t.is(await store.get('secret'), 'value')

  await store.set('boxed-value', evil)
  t.is(await store.get('boxed-value'), injection)
  await store.set('plain-value', plain)
  t.is(await store.get('plain-value'), JSON.stringify(plain))

  const date = new Date('2020-01-02T03:04:05.000Z')
  await store.set('when', date)
  t.is(await store.get('when'), date.toISOString())
  await store.set('bytes', Buffer.from(injection))
  t.is(await store.get('bytes'), injection)
  await store.set('n', 1)
  t.is(await store.get('n'), '1')
  await store.set('flag', false)
  t.is(await store.get('flag'), '0')
  await store.set('empty', null)
  t.is(await store.get('empty'), null)
  t.is(await store.get('secret'), 'value')
  await store.clear()
})

test.serial('a namespace object matches its text literally', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_namespace_objects' })
  const wildcard = { toString () { return 'n%' } }
  const backslash = { toString () { return 'a\\b' } }
  const named = namespace => new Keyv({ store, namespace })
  const wild = named(wildcard)
  const lookalike = named('nX')
  const slash = named(backslash)
  const slashLookalike = named('ab')
  await store.clear()
  await wild.set('k', 'wild')
  await lookalike.set('k', 'other')
  await slash.set('k', 'slash')
  await slashLookalike.set('k', 'ab')

  const entries = []
  for await (const entry of wild.iterator()) entries.push(entry)
  t.deepEqual(entries, [['k', 'wild']])

  await wild.clear()
  await slash.clear()
  t.is(await wild.get('k'), undefined)
  t.is(await lookalike.get('k'), 'other')
  t.is(await slash.get('k'), undefined)
  t.is(await slashLookalike.get('k'), 'ab')
  await store.clear()
})

test.serial('iterator pages through keys that contain backslashes', async t => {
  const store = new KeyvMysql(dbUrl, { table: 'keyv_pages', iterationLimit: 1 })
  const keyv = new Keyv({ store })
  await keyv.clear()
  await keyv.set('a\\b', 'one')
  await keyv.set('b', 'two')
  const keys = []
  for await (const [key] of keyv.iterator()) {
    keys.push(key)
    if (keys.length > 4) break
  }
  t.deepEqual(keys, ['a\\b', 'b'])
  await keyv.clear()
})
