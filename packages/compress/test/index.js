'use strict'

const compressBrotli = require('compress-brotli')
const JSONB = require('json-buffer')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvCompress = require('..')

test('pass compress options', async t => {
  const store = new Map()
  const keyv = KeyvCompress(new Keyv({ store, namespace: null }), {
    enable: false
  })

  await keyv.set('foo', 'bar')
  t.is(store.get('foo'), JSONB.stringify({ value: 'bar', expires: null }))
})

test('enable compression', async t => {
  const brotli = compressBrotli()
  const store = new Map()
  const keyv = KeyvCompress(new Keyv({ store, namespace: null }))
  await keyv.set('foo', 'bar')
  const compressed = await brotli.compress('bar')

  t.is(
    store.get('foo'),
    JSONB.stringify({
      value: compressed,
      expires: null
    })
  )
})
