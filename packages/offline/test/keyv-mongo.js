'use strict'

const KeyvMongo = require('@keyvhq/mongo')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const keyvOffline = require('../src')

const keyvMongo = new Keyv({
  store: new KeyvMongo({
    url: 'mongodb://user:pass@localhost:27018/test',
    collection: 'offline-test',
    serverSelectionTimeoutMS: 100,
    connectTimeoutMS: 100
  })
})

test('.set return false if mongo store is unreachable', async t => {
  const keyv = keyvOffline(keyvMongo)
  const result = await keyv.set('foo', 'expires in 1 second', 1000)
  t.is(result, false)
})

test('.get return undefined if mongo store is unreachable', async t => {
  const keyv = keyvOffline(keyvMongo)
  const result = await keyv.get('foo')
  t.is(result, undefined)
})

test('keep original keyv methods with mongo store', async t => {
  const keyv = keyvOffline(keyvMongo)
  t.is(typeof keyv.clear, 'function')
  t.is(typeof keyv.delete, 'function')
  t.is(typeof keyv.has, 'function')
})
