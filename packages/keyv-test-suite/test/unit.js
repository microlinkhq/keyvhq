const test = require('ava')
const Keyv = require('@keyvhq/keyv')
const keyvTestSuite = require('../')

const store = () => new Map()
keyvTestSuite(test, Keyv, store)
