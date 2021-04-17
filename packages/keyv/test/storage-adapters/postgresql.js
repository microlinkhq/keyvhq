const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('this');
const KeyvPostgres = require('postgres');

keyvOfficialTests(test, Keyv, 'postgresql://postgres@localhost:5432/keyv_test', 'postgresql://foo');

const store = () => new KeyvPostgres('postgresql://postgres@localhost:5432/keyv_test');
keyvTestSuite(test, Keyv, store);
