'use strict'

const test = require('ava')
const delay = require('delay')

const KeyvMulti = require('..')
const Keyv = require('@keyvhq/core')
const KeyvSqlite = require('@keyvhq/keyv-sqlite')

const remoteStore = () =>
  new Keyv({
    store: new KeyvSqlite({
      uri: 'sqlite://test/testdb.sqlite',
      busyTimeout: 30000
    })
  })
const localStore = () => new Keyv()

test.beforeEach(async () => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })
  return store.clear()
})

test.serial('.set() sets to both stores', async t => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })

  await store.set('foo', 'bar')

  const [remoteRes, localRes, storeRes] = await Promise.all([
    remote.get('foo'),
    store.get('foo'),
    local.get('foo')
  ])
  const result = remoteRes === localRes && storeRes === localRes // Check equality as 'bar' is just a string
  t.is(result, true)
})

test.serial('.has() returns boolean', async t => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })

  await store.set('foo', 'bar')

  t.is(await store.has('foo'), true)
})

test.serial('.has() checks both stores', async t => {
  const remote = remoteStore()
  const store = new KeyvMulti({ remote })

  await remote.set('fizz', 'buzz')

  t.is(await store.has('fizz'), true)
})

test.serial('.delete() deletes both stores', async t => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })

  await store.set('fizz', 'buzz')
  await store.delete('fizz')

  t.is(await store.get('fizz'), undefined)
  t.is(await local.get('fizz'), undefined)
  t.is(await remote.get('fizz'), undefined)
})

test.serial(
  '.delete({ localOnly: true }) deletes only local store',
  async t => {
    const remote = remoteStore()
    const local = localStore()
    const store = new KeyvMulti({ remote, local })

    await store.set('fizz', 'buzz')
    await store.delete('fizz', { localOnly: true })

    t.is(await local.get('fizz'), undefined)
    t.is(await remote.get('fizz'), 'buzz')
  }
)

test.serial('.clear() clears both stores', async t => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })

  await store.set('fizz', 'buzz')
  await store.clear()

  t.is(await store.get('fizz'), undefined)
})

test.serial('.clear({ localOnly: true }) clears local store alone', async t => {
  const remote = remoteStore()
  const local = localStore()
  const store = new KeyvMulti({ remote, local })

  await store.set('fizz', 'buzz')
  await store.clear({ localOnly: true })

  t.is(await local.get('fizz'), undefined)
  t.is(await remote.get('fizz'), 'buzz')
})

test.serial('ttl is valid', async t => {
  const remote = remoteStore()
  const local = new Keyv({ ttl: 100 }) // set local ttl
  const store = new KeyvMulti({ remote, local })

  await store.set('foo', 'bar')
  await remote.set('foo', 'notbar')

  await delay(100)
  t.is(await store.get('foo'), 'notbar')
})

test.serial('copy locally when is possible', async t => {
  const remote = remoteStore()
  const local = new Keyv()
  const store = new KeyvMulti({ remote, local })

  await remote.set('foo', 'bar')

  t.is(await store.get('foo'), 'bar')
  t.is(await local.get('foo'), 'bar')
})

test.serial('custom validator', async t => {
  const remote = remoteStore()
  const local = new Keyv()
  const store = new KeyvMulti({
    remote,
    local,
    validator: val => {
      if (val.timeSensitiveData) return false // fetch from remote store only
      return true
    }
  })

  await store.set('1', { timeSensitiveData: 'bar' })
  await store.set('2', { timeSensitiveData: false })

  t.deepEqual(await store.get('1'), { timeSensitiveData: 'bar' }) // fetched from remote
  t.deepEqual(await store.get('2'), { timeSensitiveData: false })

  await remote.set('1', { timeSensitiveData: 'foo1' })
  await remote.set('2', { timeSensitiveData: 'foo2' }) // set to remote so local has not been updated

  t.deepEqual(await store.get('1'), { timeSensitiveData: 'foo1' })
  t.deepEqual(await store.get('2'), { timeSensitiveData: false })
})

test.serial('boostrap with keys', async t => {
  const remote = remoteStore()
  const local = localStore()

  await remote.set('foo1', 'bar1')
  await remote.set('foo2', 'bar2')
  await remote.set('foo3', 'bar3')

  const store = new KeyvMulti({
    remote,
    local,
    bootstrap: () => ['foo1', 'foo2', 'foo3']
  })

  const values = await store.bootStrapPromise
  if (!(values.every(Boolean) && values.length === 3)) {
    t.fail('Some value failed to be set')
  }

  await remote.set('foo1', 'bar4') // remote has changes

  t.is(await store.get('foo1'), 'bar1')
  t.is(await store.get('foo2'), 'bar2')
  t.is(await store.get('foo3'), 'bar3')
})

test.serial('bootstrap with keys & values', async t => {
  const remote = remoteStore()
  const local = localStore()

  await remote.set('foo1', 'bar1')
  await remote.set('foo2', 'bar2')
  await remote.set('foo3', 'not')

  const store = new KeyvMulti({
    remote,
    local,
    bootstrap: function () {
      // run custom queries here, get key value pairs
      const arr = ['foo1', 'foo2', 'foo3'].map(async key => {
        const value = await this.remote.get(key)
        if (value.includes('bar')) return [key, value] // arbitary checking
        return undefined
      }) // remove undefined values
      return Promise.all(arr).then(x => x.filter(Boolean))
    }
  })
  await store.bootStrapPromise
  await remote.set('foo1', 'bar3') // remote has changes, but local ttl has been bootstrapped
  await remote.set('foo3', 'bar3') // remote has changes, local has not been bootstrapped with it

  t.is(await store.get('foo1'), 'bar1')
  t.is(await store.get('foo2'), 'bar2')
  t.is(await store.get('foo3'), 'bar3')
})
