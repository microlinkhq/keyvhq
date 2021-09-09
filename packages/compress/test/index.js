'use strict'

const compressBrotli = require('compress-brotli')
const JSONB = require('json-buffer')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvCompress = require('..')

test('pass compress options', async t => {
  const compressOpts = { enable: false }
  const brotli = compressBrotli(compressOpts)
  const store = new Map()
  const keyv = KeyvCompress(new Keyv({ store, namespace: null }), compressOpts)

  await keyv.set('foo', 'bar')
  t.is(store.get('foo'), JSONB.stringify({ value: 'bar', expires: null }))

  t.deepEqual(
    await keyv.deserialize(JSONB.stringify({ value: 'bar', expires: null })),
    await brotli.deserialize(
      JSONB.stringify({ value: await brotli.decompress('bar'), expires: null })
    )
  )
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
