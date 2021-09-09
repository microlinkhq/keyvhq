'use strict'

const Keyv = require('@keyvhq/core')
const test = require('ava')

const keyvOffline = require('../src')

test('.set return true under nornal behavior', async t => {
  const store = new Map()
  const keyv = keyvOffline(new Keyv({ store }))
  const result = await keyv.set('foo', 'expires in 1 second', 1000)
  t.is(result, true)
})

test('.get return the expected value under nornal behavior', async t => {
  const store = new Map()
  const keyv = keyvOffline(new Keyv({ store }))
  await keyv.set('foo', 'bar')
  t.is(await keyv.get('foo'), 'bar')
})
