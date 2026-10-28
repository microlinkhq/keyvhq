'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvMysql = require('..')

const dbUrl = process.env.MYSQL_URL || 'mysql://root:root@127.0.0.1/keyv_test'
const store = () => new KeyvMysql(dbUrl)
keyvTestSuite(test, Keyv, store)

const specialKeys = ["'", '\\', "\\'", '%', '_', 'a\\nb', "x\\') OR 1=1 -- "]

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
  }

  for (const namespace of ['a\\b', 'x\\', 'n%', 'u_']) await keyvs[namespace].clear()

  for (const namespace of namespaces) {
    const expected = ['ab', 'x', 'nX', 'uX'].includes(namespace) ? namespace : undefined
    t.is(await keyvs[namespace].get('k'), expected, `get after clear (${namespace})`)
  }
  await store.clear()
})
