'use strict'

const { setTimeout } = require('timers/promises')
const { execFile } = require('child_process')
const { promisify } = require('util')
const KeyvFile = require('@keyvhq/file')
const Keyv = require('@keyvhq/core')
const path = require('path')
const test = require('ava')

const KeyvStats = require('..')

const fixture = path.join(__dirname, 'fixture.json')

test.beforeEach(() => {
  const keyv = new Keyv({ store: new KeyvFile(fixture) })
  keyv.clear()
})

test('namespace support', async t => {
  const store = new Map()

  const keyvOne = new KeyvStats(
    new Keyv({
      store,
      namespace: 'one'
    }),
    { interval: 0 }
  )

  const keyvTwo = new KeyvStats(
    new Keyv({
      store,
      namespace: 'two'
    }),
    { interval: 0 }
  )

  t.deepEqual(await keyvOne.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 0, percent: '0%' },
    total: 0
  })

  t.deepEqual(await keyvTwo.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 0, percent: '0%' },
    total: 0
  })

  await keyvOne.set('foo', 'bar')
  await keyvOne.get('foo')
  await keyvOne.stats.save()
  await keyvTwo.stats.save()

  t.deepEqual(await keyvOne.stats.info(), {
    hit: { value: 1, percent: '100%' },
    miss: { value: 0, percent: '0%' },
    total: 1
  })

  t.deepEqual(await keyvTwo.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 0, percent: '0%' },
    total: 0
  })
})

test.serial('get hit ratio', async t => {
  const keyv = new KeyvStats(
    new Keyv({
      store: new KeyvFile(fixture)
    }),
    { interval: 25 }
  )

  await keyv.stats.reset()

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 0, percent: '0%' },
    total: 0
  })

  await keyv.get('foo')
  await setTimeout(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 1, percent: '100%' },
    total: 1
  })

  await keyv.set('foo', 'bar')
  await keyv.get('foo')
  await setTimeout(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 1, percent: '50%' },
    miss: { value: 1, percent: '50%' },
    total: 2
  })

  await keyv.get('foo')
  await setTimeout(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 2, percent: '67%' },
    miss: { value: 1, percent: '33%' },
    total: 3
  })

  await keyv.get('foo')
  await setTimeout(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 3, percent: '75%' },
    miss: { value: 1, percent: '25%' },
    total: 4
  })
})

const countSaves = async (interval, duration) => {
  const counted = { saves: 0 }
  const store = new Map()
  const set = store.set.bind(store)
  store.set = (key, value) => {
    ++counted.saves
    return set(key, value)
  }

  const timers = []
  const originalSetInterval = global.setInterval
  global.setInterval = (callback, delay, ...args) => {
    const timer = originalSetInterval(callback, delay, ...args)
    timers.push(timer)
    return timer
  }

  try {
    const keyv = new KeyvStats(new Keyv({ store }), { interval })
    await keyv.get('foo')
    await setTimeout(duration)
    return counted
  } finally {
    global.setInterval = originalSetInterval
    for (const timer of timers) clearInterval(timer)
  }
}

test.serial('saves once per interval', async t => {
  const { saves } = await countSaves(100, 350)
  t.true(saves >= 2 && saves <= 4, `expected 2 to 4 saves in 350ms, got ${saves}`)
})

test.serial('an interval beyond the timer limit does not save in a loop', async t => {
  t.is((await countSaves(Infinity, 100)).saves, 0)
})

test.serial('an interval below one millisecond does not save in a loop', async t => {
  t.is((await countSaves(0.5, 100)).saves, 0)
})

test.serial('an interval of one millisecond saves that often', async t => {
  const { saves } = await countSaves(1, 80)
  t.true(saves >= 10 && saves <= 120, `expected 10 to 120 saves in 80ms, got ${saves}`)
})

test.serial('the save timer stops when counting ends', async t => {
  const counted = await countSaves(1, 40)
  const { saves } = counted
  t.true(saves >= 5 && saves <= 80, `expected 5 to 80 saves in 40ms, got ${saves}`)
  await setTimeout(40)
  t.is(counted.saves, saves)
})

test.serial('counting saves restores setInterval', async t => {
  const original = global.setInterval
  await countSaves(0, 0)
  t.is(global.setInterval, original)
})

test('the save interval does not keep the process alive', async t => {
  const script = `
    const Keyv = require('@keyvhq/core')
    const KeyvStats = require(${JSON.stringify(path.join(__dirname, '..'))})
    KeyvStats(new Keyv())
  `
  await t.notThrowsAsync(
    promisify(execFile)(process.execPath, ['-e', script], {
      cwd: __dirname,
      timeout: 5000
    })
  )
})
