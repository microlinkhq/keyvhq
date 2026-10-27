'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const tk = require('timekeeper')
const test = require('ava')

const Keyv = require('..')

test.serial('Keyv is a class', t => {
  t.is(typeof Keyv, 'function')
  t.throws(() => Keyv()) // eslint-disable-line new-cap
  t.notThrows(() => new Keyv())
})

test.serial('Keyv stores values in the json-buffer format', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  const value = {
    buffer: Buffer.from('hi'),
    list: [Buffer.from('a'), ':x', '::y'],
    text: ':base64:not-a-buffer',
    plain: 'plain'
  }
  await keyv.set('foo', value)
  t.is(
    store.get('foo'),
    '{"value":{"buffer":":base64:aGk=","list":[":base64:YQ==","::x",":::y"],"text":"::base64:not-a-buffer","plain":"plain"},"expires":null}'
  )
  t.deepEqual(await keyv.get('foo'), value)
})

test.serial('Keyv accepts storage adapters', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  t.is(store.size, 0)
  await keyv.set('foo', 'bar')
  t.is(await keyv.get('foo'), 'bar')
  t.is(store.size, 1)
})

test.serial('Keyv passes tll info to stores', async t => {
  t.plan(1)
  const store = new Map()
  const storeSet = store.set
  store.set = (key, value, ttl) => {
    t.is(ttl, 100)
    storeSet.call(store, key, value, ttl)
  }

  const keyv = new Keyv({ store })
  await keyv.set('foo', 'bar', 100)
})

test.serial('Keyv respects default tll option', async t => {
  const store = new Map()
  const keyv = new Keyv({ store, ttl: 100 })
  await keyv.set('foo', 'bar')
  t.is(await keyv.get('foo'), 'bar')
  tk.freeze(Date.now() + 150)
  t.is(await keyv.get('foo'), undefined)
  t.is(store.size, 0)
  tk.reset()
})

test.serial('.set(key, value, ttl) overwrites default tll option', async t => {
  const startTime = Date.now()
  tk.freeze(startTime)
  const store = new Map()
  const keyv = new Keyv({ store, ttl: 200 })
  await keyv.set('foo', 'bar')
  await keyv.set('fizz', 'buzz', 100)
  await keyv.set('ping', 'pong', 300)
  t.is(await keyv.get('foo'), 'bar')
  t.is(await keyv.get('fizz'), 'buzz')
  t.is(await keyv.get('ping'), 'pong')
  tk.freeze(startTime + 150)
  t.is(await keyv.get('foo'), 'bar')
  t.is(await keyv.get('fizz'), undefined)
  t.is(await keyv.get('ping'), 'pong')
  tk.freeze(startTime + 250)
  t.is(await keyv.get('foo'), undefined)
  t.is(await keyv.get('ping'), 'pong')
  tk.freeze(startTime + 350)
  t.is(await keyv.get('ping'), undefined)
  tk.reset()
})

test.serial(
  '.set(key, value, ttl) where ttl is "0" overwrites default tll option and sets key to never expire',
  async t => {
    const startTime = Date.now()
    tk.freeze(startTime)
    const store = new Map()
    const keyv = new Keyv({ store, ttl: 200 })
    await keyv.set('foo', 'bar', 0)
    t.is(await keyv.get('foo'), 'bar')
    tk.freeze(startTime + 250)
    t.is(await keyv.get('foo'), 'bar')
    tk.reset()
  }
)

test.serial(
  '.get(key, {raw: true}) returns the raw object instead of the value',
  async t => {
    const store = new Map()
    const keyv = new Keyv({ store })
    await keyv.set('foo', 'bar')
    const value = await keyv.get('foo')
    const rawObject = await keyv.get('foo', { raw: true })
    t.is(value, 'bar')
    t.is(rawObject.value, 'bar')
  }
)

test.serial(
  'Keyv uses a custom serializer when one is provided',
  async t => {
    t.plan(3)
    const store = new Map()
    const serialize = data => {
      t.pass()
      return JSON.stringify(data)
    }

    const deserialize = data => {
      t.pass()
      return JSON.parse(data)
    }

    const keyv = new Keyv({ store, serialize, deserialize })
    await keyv.set('foo', 'bar')
    t.is(await keyv.get('foo'), 'bar')
  }
)

test.serial('Keyv supports async serializer/deserializer', async t => {
  t.plan(3)
  const store = new Map()

  const serialize = async data => {
    t.pass()
    return JSON.stringify(data)
  }

  const deserialize = async data => {
    t.pass()
    return JSON.parse(data)
  }

  const keyv = new Keyv({ store, serialize, deserialize })
  await keyv.set('foo', 'bar')
  t.is(await keyv.get('foo'), 'bar')
})

test.serial('Keyv uses an empty namespace by default', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  await keyv.set('foo', 'bar')
  t.is([...store.keys()][0], 'foo')
})

test.serial('Default namespace can be overridden', async t => {
  const store = new Map()
  const keyv = new Keyv({ store, namespace: 'magic' })
  await keyv.set('foo', 'bar')
  t.is([...store.keys()][0], 'magic:foo')
})

test.serial('An empty namespace stores the key as a string', async t => {
  const store = new Map()
  const keyv = new Keyv({ store, namespace: '' })
  await keyv.set(42, 'foo')
  t.is([...store.keys()][0], '42')
})

test.serial('Buffers are stored as base64 without Buffer#toJSON', async t => {
  const { toJSON } = Buffer.prototype
  let calls = 0
  Buffer.prototype.toJSON = function () {
    calls++
    return toJSON.call(this)
  }
  try {
    const store = new Map()
    const keyv = new Keyv({ store })
    const buffer = Buffer.from('hello')
    await keyv.set('top', buffer)
    await keyv.set('nested', { a: buffer, list: [buffer, ':text'] })
    t.is(calls, 0)
    t.is(store.get('top'), '{"value":":base64:aGVsbG8=","expires":null}')
    t.is(
      store.get('nested'),
      '{"value":{"a":":base64:aGVsbG8=","list":[":base64:aGVsbG8=","::text"]},"expires":null}'
    )
    t.deepEqual(await keyv.get('nested'), { a: buffer, list: [buffer, ':text'] })
  } finally {
    Buffer.prototype.toJSON = toJSON
  }
})

test.serial('Boxed strings are escaped like strings', async t => {
  const keyv = new Keyv({ store: new Map() })
  await keyv.set('boxed', new String(':base64:aGk=')) // eslint-disable-line no-new-wrappers
  t.is(await keyv.get('boxed'), ':base64:aGk=')
  await keyv.set('nested', { list: [new String(':x')] }) // eslint-disable-line no-new-wrappers
  t.deepEqual(await keyv.get('nested'), { list: [':x'] })
})

test.serial('A nested serialize does not reuse the outer copy', async t => {
  const keyv = new Keyv()
  const buf = Buffer.from('a')
  const shared = { buffer: buf }
  let nestedBytes
  const value = {
    shared,
    nested: {
      toJSON () {
        buf[0] = 'b'.charCodeAt(0)
        nestedBytes = keyv.serialize({ value: shared, expires: null })
        return { ok: true }
      }
    }
  }
  await keyv.set('k', value)
  t.is(nestedBytes, '{"value":{"buffer":":base64:Yg=="},"expires":null}')
})

test.serial('Serialize can reenter while a cycle is being copied', async t => {
  const keyv = new Keyv()
  const value = {
    buffer: Buffer.from('c'),
    nested: {
      toJSON () {
        keyv.serialize({ value: { buffer: Buffer.from('in') }, expires: null })
        return { text: ':n' }
      }
    }
  }
  value.self = value
  t.is((await t.throwsAsync(keyv.set('k', value))).name, 'TypeError')
})

test.serial('A cycle that contains a Buffer throws', async t => {
  const keyv = new Keyv()
  const value = { buffer: Buffer.from('x') }
  value.self = value
  t.is((await t.throwsAsync(keyv.set('object', value))).name, 'TypeError')

  const list = [Buffer.from('x')]
  list.push(list)
  t.is((await t.throwsAsync(keyv.set('list', list))).name, 'TypeError')
})

test.serial('A shared object that contains a Buffer is stored twice', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  const shared = { buffer: Buffer.from('ab'), text: ':z' }
  await keyv.set('root', { x: shared, y: shared })
  t.is(
    store.get('root'),
    '{"value":{"x":{"buffer":":base64:YWI=","text":"::z"},"y":{"buffer":":base64:YWI=","text":"::z"}},"expires":null}'
  )
  t.deepEqual(await keyv.get('root'), {
    x: { buffer: Buffer.from('ab'), text: ':z' },
    y: { buffer: Buffer.from('ab'), text: ':z' }
  })
})

test.serial('A function property is omitted', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  const fn = () => {}
  fn.buffer = Buffer.from('x')
  await keyv.set('k', { fn, list: [fn, 1], keep: 1 })
  t.is(store.get('k'), '{"value":{"list":[null,1],"keep":1},"expires":null}')
  t.deepEqual(await keyv.get('k'), { list: [null, 1], keep: 1 })
})

test.serial('Storing a value does not mutate it', async t => {
  const keyv = new Keyv()
  const buffer = Buffer.from('hi')
  const value = { buffer, list: [buffer, ':x'], text: 'plain' }
  await keyv.set('k', value)
  t.is(value.buffer, buffer)
  t.deepEqual(value, { buffer, list: [buffer, ':x'], text: 'plain' })
})

test.serial('Inherited enumerable buffers are not stored', async t => {
  const store = new Map()
  const keyv = new Keyv({ store })
  const proto = { buffer: Buffer.from('secret'), text: ':hidden' }
  const value = Object.assign(Object.create(proto), { own: 'yes' })
  await keyv.set('k', value)
  t.is(store.get('k'), '{"value":{"own":"yes"},"expires":null}')
  t.deepEqual(await keyv.get('k'), { own: 'yes' })
})

const store = () => new Map()
keyvTestSuite(test, Keyv, store)
