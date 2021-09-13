'use strict'

const test = require('ava')
const Keyv = require('../src')

const createCase = (test, key, value = 'foobar') =>
  test(String(key), async t => {
    const store = new Map()
    const keyv = new Keyv({ store })
    await keyv.set(key, value)
    t.is(await keyv.get(key), value)
  })

createCase(test, 'string')
createCase(test, 123)
createCase(test, null)
createCase(test, undefined)
createCase(test, NaN)
createCase(test, Infinity)
createCase(test, true)
createCase(test, false)
createCase(test, '😍')
createCase(test, '¯\\_(ツ)_/¯')
createCase(test, Buffer.from('string'))
