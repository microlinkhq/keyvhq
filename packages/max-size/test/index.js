'use strict'

const keyvCompress = require('@keyvhq/compress')
const Keyv = require('@keyvhq/core')
const bytes = require('bytes')
const test = require('ava')

const KeyvMaxSize = require('..')
const { byteLength } = KeyvMaxSize

test('byteLength handles string values', t => {
  t.is(byteLength('hello'), Buffer.byteLength('hello'))
})

test('byteLength handles Buffer values', t => {
  const value = Buffer.from('hello')
  t.is(byteLength(value), value.byteLength)
})

test('byteLength handles typed arrays', t => {
  const value = new Uint8Array([1, 2, 3, 4, 5])
  t.is(byteLength(value), value.byteLength)
})

test('byteLength handles object values', t => {
  const value = { hello: 'world' }
  t.is(byteLength(value), Buffer.byteLength(JSON.stringify(value)))
})

test('byteLength returns 0 for undefined', t => {
  t.is(byteLength(undefined), 0)
})

test('.set stores values smaller than maxSize', async t => {
  const store = new Map()
  const keyv = KeyvMaxSize(new Keyv({ store, namespace: null }), {
    maxSize: 128
  })

  t.true(await keyv.set('foo', 'bar'))
  t.true(store.has('foo'))
  t.is(await keyv.get('foo'), 'bar')
})

test('throws when maxSize is not provided', t => {
  const store = new Map()
  const keyv = new Keyv({ store, namespace: null })

  const error = t.throws(() => KeyvMaxSize(keyv), { instanceOf: TypeError })
  t.is(error.message, '`maxSize` must be provided as a positive number.')
})

test('.set skips values larger than maxSize', async t => {
  const store = new Map()
  const keyv = KeyvMaxSize(new Keyv({ store, namespace: null }), {
    maxSize: 32
  })

  t.true(await keyv.set('foo', 'this-is-bigger-than-8-bytes'))
  t.false(store.has('foo'))
  t.is(await keyv.get('foo'), undefined)
})

test('onSkip receives skip context', async t => {
  const store = new Map()
  const skipped = []

  const keyv = KeyvMaxSize(new Keyv({ store, namespace: null }), {
    maxSize: 32,
    onSkip: context => {
      skipped.push(context)
    }
  })

  await keyv.set('foo', 'this-is-bigger-than-8-bytes')

  t.is(skipped.length, 1)
  t.is(skipped[0].key, 'foo')
  t.is(skipped[0].maxSize, 32)
  t.true(skipped[0].valueSize > 32)
})

test('custom size calculator can be used', async t => {
  const store = new Map()

  const keyv = KeyvMaxSize(new Keyv({ store, namespace: null }), {
    maxSize: 1,
    size: () => 1
  })

  await keyv.set('foo', 'this-is-bigger-than-1-byte')

  t.true(store.has('foo'))
})

test('accepts maxSize from bytes helper', async t => {
  const store = new Map()
  const keyv = KeyvMaxSize(new Keyv({ store, namespace: null }), {
    maxSize: bytes('1KB')
  })

  await keyv.set('small', 'a'.repeat(64))
  await keyv.set('big', 'a'.repeat(2048))

  t.true(store.has('small'))
  t.false(store.has('big'))
})

test('works with compressed serialization', async t => {
  const store = new Map()
  const payload = 'a'.repeat(10000)

  const keyv = KeyvMaxSize(
    keyvCompress(new Keyv({ store, namespace: null })),
    { maxSize: 128 }
  )

  await keyv.set('foo', payload)

  t.true(store.has('foo'))
  t.is(await keyv.get('foo'), payload)
})
