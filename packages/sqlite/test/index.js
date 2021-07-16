'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvSqlite = require('..')

const store = () =>
  new KeyvSqlite({ uri: 'sqlite://test/testdb.sqlite', busyTimeout: 30000 })
keyvTestSuite(test, Keyv, store)
