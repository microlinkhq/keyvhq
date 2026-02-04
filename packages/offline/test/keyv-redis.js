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

test('.set return false if redis store is unreachable', async t => {
  const keyv = keyvOffline(keyvRedis)
  const result = await keyv.set('foo', 'expires in 1 second', 1000)
  t.is(result, false)
})

test('.get return undefined if redis store is unreachable', async t => {
  const keyv = keyvOffline(keyvRedis)
  const result = await keyv.get('foo')
  t.is(result, undefined)
})

test('keep original keyv methods with redis store', async t => {
  const keyv = keyvOffline(keyvRedis)
  t.is(typeof keyv.clear, 'function')
  t.is(typeof keyv.delete, 'function')
  t.is(typeof keyv.has, 'function')
})

test('does not throw when redis connection fails during set', async t => {
  const keyv = keyvOffline(keyvRedis)
  await t.notThrowsAsync(async () => {
    await keyv.set('key1', 'value1')
    await keyv.set('key2', 'value2')
    await keyv.set('key3', 'value3')
  })
})

test('does not throw when redis connection fails during get', async t => {
  const keyv = keyvOffline(keyvRedis)
  await t.notThrowsAsync(async () => {
    await keyv.get('key1')
    await keyv.get('key2')
    await keyv.get('key3')
  })
})
