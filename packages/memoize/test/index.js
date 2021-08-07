'use strict'

const Keyv = require('@keyvhq/core')
const delay = require('delay')
const test = require('ava')

const memoize = require('../src')

const deferred = () => {
  const defer = {}
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}

const asyncSum = (...numbers) =>
  numbers.reduce((wait, n) => wait.then(sum => sum + n), Promise.resolve(0))

const syncSum = (...numbers) => numbers.reduce((sum, n) => sum + n, 0)

test('should store result as arg0', async t => {
  const memoizedSum = memoize(asyncSum)
  await memoizedSum(1, 2)
  t.is(await memoizedSum.keyv.get('1'), 3)
})

test('should be possible to specify how key is obtained', async t => {
  const memoizedSum = memoize(asyncSum, undefined, { key: syncSum })
  await memoizedSum(1, 2, 3)
  t.is(await memoizedSum.keyv.get('6'), 6)
})

test('should return result', async t => {
  const memoized = memoize(asyncSum)
  t.is(await memoized(1, 2), 3)
})

test('should return pending result', async t => {
  let called = 0
  const defer = deferred()
  const spy = () => {
    ++called
    return defer.promise
  }
  const memoized = memoize(spy)

  const results = Promise.all([memoized('test'), memoized('test')])
  defer.resolve('result')

  t.deepEqual(await results, ['result', 'result'])
  t.is(called, 1)
})

test('should return cached result', async t => {
  let called = 0

  const memoized = memoize(n => {
    ++called
    return asyncSum(n)
  })

  await memoized.keyv.set('5', 5)

  await memoized(5)

  t.is(called, 0)
})

test('should be able to decorate the value', async t => {
  const keyv = new Keyv()
  const memoized = memoize(asyncSum, keyv, {
    value: value => `Result is ${value}`
  })
  t.is(await memoized(5), 'Result is 5')
})

test('should throw error', async t => {
  const memoized = memoize(() => Promise.reject(new Error('NOPE')))
  await t.throwsAsync(memoized)
  const error = await t.throwsAsync(memoized)
  t.is(error.message, 'NOPE')
})

test('should not cache error', async t => {
  let called = 0

  const memoized = memoize(() => {
    ++called
    return Promise.reject(new Error('NOPE'))
  })

  await t.throwsAsync(memoized)
  const error = await t.throwsAsync(memoized)

  t.is(error.message, 'NOPE')
  t.is(called, 2)
})

test('should return fresh result', async t => {
  const keyv = new Keyv()

  let called = 0

  const fn = n => {
    console.log(called)
    ++called
    return asyncSum(n)
  }

  const memoizedSum = memoize(fn, keyv, { staleTtl: 100 })
  keyv.set('5', 5, 200)
  await delay(10)

  t.is(await memoizedSum(5), 5)
  t.is(called, 0)
})

test('should return stale result but refresh', async t => {
  const keyv = new Keyv()
  let lastArgs

  const fn = (...args) => {
    lastArgs = args
    return asyncSum(...args)
  }

  const memoizedSum = memoize(fn, keyv, { staleTtl: 10, objectMode: true })
  await memoizedSum.keyv.set('1', 1, 5)
  const [sum, { isStale }] = await memoizedSum(1, 2)

  t.is(sum, 1)
  t.true(isStale)
  t.deepEqual(lastArgs, [1, 2])
})

test('should emit on stale refresh error', async t => {
  const fn = () => Promise.reject(new Error('NOPE'))
  const keyv = new Keyv()
  const memoizedSum = memoize(fn, keyv, { staleTtl: 10, objectMode: true })

  await keyv.set('1', 1, 5)
  const [, info] = await memoizedSum(1)

  console.log(info)

  t.is(info.staleError.message, 'NOPE')
})

test('should return cached result if a stale refresh is pending', async t => {
  const defer = deferred()
  const keyv = new Keyv()

  let called = 0

  const fn = () => {
    ++called
    return defer.promise
  }

  const memoizedSum = memoize(fn, keyv, { staleTtl: 10 })
  await memoizedSum.keyv.set('1', 1, 5)

  t.is(await memoizedSum(1), 1)
  t.is(await memoizedSum(1), 1)
  t.is(called, 1)
})

test('should delete expired result and return fresh result', async t => {
  const keyv = new Keyv()
  const memoizedSum = memoize(asyncSum, keyv)

  await keyv.set('1', 1, 1)
  await delay(5)

  t.is(await memoizedSum(1, 2), 3)
})

test('should not store result if undefined', async t => {
  const fn = async () => undefined
  const keyv = new Keyv()

  const memoizedSum = memoize(fn, keyv)
  await memoizedSum(5)

  t.false(await keyv.has(5))
})

test('should use existing Keyv instance', t => {
  const keyv = new Keyv()
  const memoizedSum = memoize(asyncSum, keyv)
  t.deepEqual(memoizedSum.keyv, keyv)
})

test('should create new Keyv instance', t => {
  const store = new Map()
  const memoizedSum = memoize(asyncSum, { store })
  t.true(memoizedSum.keyv instanceof Keyv)
  t.deepEqual(memoizedSum.keyv.store, store)
})

test('should store result with static ttl', async t => {
  let calls = []

  const store = new Map()
  const set = store.set.bind(store)

  const proxySet = (...args) => {
    calls = args
    return set(...args)
  }

  const memoizedSum = memoize(asyncSum, { ...store, set: proxySet }, { ttl: 5 })
  await memoizedSum(1, 2)
  t.deepEqual(calls, [1, 3, 5])
})

test('should store result with dynamic ttl', async t => {
  let calls = []

  const store = new Map()
  const set = store.set.bind(store)

  const proxySet = (...args) => {
    calls = args
    return set(...args)
  }

  const memoizedSum = memoize(
    asyncSum,
    { ...store, set: proxySet },
    { ttl: syncSum }
  )
  await memoizedSum(1, 2, 3)
  t.deepEqual(calls, [1, 6, 6])
})
