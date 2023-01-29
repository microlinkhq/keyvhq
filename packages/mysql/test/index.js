'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvMysql = require('..')

const dbUrl = process.env.MYSQL_URL || 'mysql://root:root@127.0.0.1/keyv_test'
const store = () => new KeyvMysql(dbUrl)
keyvTestSuite(test, Keyv, store)
