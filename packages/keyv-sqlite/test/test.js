const test = require('ava');
const keyvTestSuite = require('@jytesh/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('keyv');
const KeyvSqlite = require('../src/index');

keyvOfficialTests(test, Keyv, 'sqlite://test/testdb.sqlite', 'sqlite://non/existent/database.sqlite');

const store = () => new KeyvSqlite({ uri: 'sqlite://test/testdb.sqlite', busyTimeout: 30000 });
keyvTestSuite(test, Keyv, store);
