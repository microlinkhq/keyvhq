const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const Keyv = require('@keyvhq/keyv');
const KeyvSqlite = require('../src/index');

const store = () => new KeyvSqlite({ uri: 'sqlite://test/testdb.sqlite', busyTimeout: 30000 });
keyvTestSuite(test, Keyv, store);
