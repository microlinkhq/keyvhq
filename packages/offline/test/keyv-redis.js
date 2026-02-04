'use strict'

const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const keyvOffline = require('../src')

const keyvRedis = new Keyv({
  store: new KeyvRedis({
    uri: 'redis://user:pass@localhost:1337',
    maxRetriesPerRequest: 0
  })
})

test('.set return false if store is unreachable', async t => {
  const keyv = keyvOffline(keyvRedis)
  const result = await keyv.set('foo', 'expires in 1 second', 1000)
  t.is(result, false)
})

test('.set return undefined if store is unreachable', async t => {
  const keyv = keyvOffline(keyvRedis)
  const result = await keyv.get('foo')
  t.is(result, undefined)
})

test('keep original keyv methods', async t => {
  const keyv = keyvOffline(keyvRedis)
  t.is(typeof keyv.clear, 'function')
})
