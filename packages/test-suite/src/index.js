'use strict'

const keyvNamespaceTests = require('./namespace')
const keyvIteratorTests = require('./iteration')
const keyvValueTests = require('./values')
const keyvApiTests = require('./api')

const keyvTestSuite = (test, Keyv, store) => {
  keyvIteratorTests(test, Keyv, store)
  keyvApiTests(test, Keyv, store)
  keyvValueTests(test, Keyv, store)
  keyvNamespaceTests(test, Keyv, store)
}

Object.assign(keyvTestSuite, {
  keyvApiTests,
  keyvValueTests,
  keyvNamespaceTests,
  keyvIteratorTests
})

module.exports = keyvTestSuite
