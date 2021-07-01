'use strict'

const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const KeyvMysql = require('@keyvhq/keyv-mysql')
const test = require('ava')

const Keyv = require('../..')

const store = () => new KeyvMysql('mysql://mysql@localhost/keyv_test')
keyvTestSuite(test, Keyv, store)
