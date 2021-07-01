'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const KeyvMongo = require('@keyvhq/keyv-mongo')
const test = require('ava')

const Keyv = require('../..')

const store = () => new KeyvMongo('mongodb://127.0.0.1:27017')
keyvTestSuite(test, Keyv, store)
