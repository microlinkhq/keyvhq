'use strict'

const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const test = require('ava')

const KeyvFile = require('../src')

const fixture = path.join(__dirname, 'fixture.json')
const backup = readFileSync(fixture, 'utf-8')

const load = filepath => JSON.parse(readFileSync(filepath))

test.afterEach(() => writeFileSync(fixture, backup))

test.serial('clear content file', async t => {
  const uri = fixture
  const store = new KeyvFile(uri)
  await store.set('fooz', 'barz')
  await store.clear()
  t.is(store.size, 0)
  t.is(Object.keys(load(uri)).length, 0)
})

test.serial('write into a file', async t => {
  const uri = fixture
  const store = new KeyvFile(uri)
  await store.set('fooz', 'barz')
  t.is(await store.get('fooz'), 'barz')
  t.is(load(uri).fooz, 'barz')
})

test.serial('load a previous declared file', async t => {
  const uri = fixture
  const store = new KeyvFile(uri)
  t.is(store.size, 1)
  t.is(await store.get('foo'), 'bar')
})

test.serial('write into a non previously declared file', async t => {
  const uri = path.join(__dirname, 'fixtures2/fixture.json')
  const store = new KeyvFile(uri)
  await store.set('fooz', 'barz')
  t.is(await store.get('fooz'), 'barz')
  t.is(load(uri).fooz, 'barz')
})
