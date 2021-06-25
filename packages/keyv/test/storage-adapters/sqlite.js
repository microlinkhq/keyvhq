const test = require('ava')
const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const Keyv = require('this')
const KeyvSqlite = require('sqlite')

const store = () => new KeyvSqlite('sqlite://test/testdb.sqlite')
keyvTestSuite(test, Keyv, store)
