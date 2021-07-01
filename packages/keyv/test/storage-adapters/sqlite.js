'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const KeyvSqlite = require('sqlite')
const test = require('ava')

const Keyv = require('../..')

const store = () => new KeyvSqlite('sqlite://test/testdb.sqlite')
keyvTestSuite(test, Keyv, store)
