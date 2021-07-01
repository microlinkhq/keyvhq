'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const KeyvPostgres = require('postgres')
const test = require('ava')

const Keyv = require('../..')

const store = () =>
  new KeyvPostgres('postgresql://postgres@localhost:5432/keyv_test')
keyvTestSuite(test, Keyv, store)
