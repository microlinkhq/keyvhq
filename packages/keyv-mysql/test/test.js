const test = require('ava');
const keyvTestSuite, { keyvOfficialTests } = require('@keyvhq/keyv-test-suite');
const Keyv = require('keyv');
const KeyvMysql = require('this');

keyvOfficialTests(test, Keyv, 'mysql://mysql@localhost/keyv_test', 'mysql://foo');

const store = () => new KeyvMysql('mysql://mysql@localhost/keyv_test');
keyvTestSuite(test, Keyv, store);
