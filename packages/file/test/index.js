'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const path = require('path')
const test = require('ava')

const KeyvFile = require('../src')

const store = () => new KeyvFile(path.join(__dirname, 'test.json'))
keyvTestSuite(test, Keyv, store)
