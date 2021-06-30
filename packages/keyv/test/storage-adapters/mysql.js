const test = require('ava')
const keyvTestSuite = require('@keyvhq/keyv-test-suite')
const Keyv = require('../../')
const KeyvMysql = require('@keyvhq/keyv-mysql')

const store = () => new KeyvMysql('mysql://mysql@localhost/keyv_test')
keyvTestSuite(test, Keyv, store)
