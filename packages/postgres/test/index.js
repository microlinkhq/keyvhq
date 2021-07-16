'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvPostgres = require('..')

const store = () =>
  new KeyvPostgres({
    uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test'
  })

keyvTestSuite(test, Keyv, store)
