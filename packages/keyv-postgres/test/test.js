'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const Keyv = require('@keyvhq/keyv')
const test = require('ava')

const KeyvPostgres = require('..')

const store = () =>
  new KeyvPostgres({
    uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test'
  })

keyvTestSuite(test, Keyv, store)
