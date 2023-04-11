'use strict'

const KeyvFile = require('@keyvhq/file')
const Keyv = require('@keyvhq/core')
const delay = require('delay')
const path = require('path')
const test = require('ava')

const KeyvStats = require('..')

const fixture = path.join(__dirname, 'fixture.json')

test.beforeEach(() => {
  const keyv = KeyvStats(
    new Keyv({
      store: new KeyvFile(fixture)
    })
  )
  keyv.clear()
})

test('get hit ratio', async t => {
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
  await delay(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 0, percent: '0%' },
    miss: { value: 1, percent: '100%' },
    total: 1
  })

  await keyv.set('foo', 'bar')
  await keyv.get('foo')
  await delay(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 1, percent: '50%' },
    miss: { value: 1, percent: '50%' },
    total: 2
  })

  await keyv.get('foo')
  await delay(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 2, percent: '67%' },
    miss: { value: 1, percent: '33%' },
    total: 3
  })

  await keyv.get('foo')
  await delay(50)

  t.deepEqual(await keyv.stats.info(), {
    hit: { value: 3, percent: '75%' },
    miss: { value: 1, percent: '25%' },
    total: 4
  })
})
