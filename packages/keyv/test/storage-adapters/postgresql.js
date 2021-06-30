const test = require('ava')
const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const Keyv = require('../../')
const KeyvPostgres = require('postgres')

const store = () => new KeyvPostgres('postgresql://postgres@localhost:5432/keyv_test')
keyvTestSuite(test, Keyv, store)
