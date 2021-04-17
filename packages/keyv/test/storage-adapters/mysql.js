const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('this');
const KeyvMysql = require('@keyvhq/keyv-mysql');

keyvOfficialTests(test, Keyv, 'mysql://mysql@localhost/keyv_test', 'mysql://foo');

const store = () => new KeyvMysql('mysql://mysql@localhost/keyv_test');
keyvTestSuite(test, Keyv, store);
