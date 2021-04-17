const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('this');
const KeyvSqlite = require('sqlite');

keyvOfficialTests(test, Keyv, 'sqlite://test/testdb.sqlite', 'sqlite://non/existent/database.sqlite');

const store = () => new KeyvSqlite('sqlite://test/testdb.sqlite');
keyvTestSuite(test, Keyv, store);
