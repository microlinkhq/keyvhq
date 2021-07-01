'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const KeyvRedis = require('redis')
const test = require('ava')

const Keyv = require('../..')

const store = () => new KeyvRedis('redis://localhost')
keyvTestSuite(test, Keyv, store)
