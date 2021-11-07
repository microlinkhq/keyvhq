'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvCFKV = require('..')

const { key, email, accountId, namespaceId } = process.env

const store = () => new KeyvCFKV({ key, email, accountId, namespaceId })

keyvTestSuite(test, Keyv, store)
