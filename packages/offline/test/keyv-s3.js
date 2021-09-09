'use strict'

const KeyvS3 = require('keyv-s3')
const test = require('ava')

const keyvOffline = require('../src')

const keyvS3 = new KeyvS3({
  region: 'us-east-1',
  namespace: undefined,
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  maxRetries: 0
})

test('.set return false if store is unreachable', async t => {
  const keyv = keyvOffline(keyvS3)
  const result = await keyv.set('foo', 'expires in 1 second', 1000)
  t.is(result, false)
})

test('.set return undefined if store is unreachable', async t => {
  const keyv = keyvOffline(keyvS3)
  const result = await keyv.get('foo')
  t.is(result, undefined)
})
