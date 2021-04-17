const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('this');
const KeyvRedis = require('redis');

keyvOfficialTests(test, Keyv, 'redis://localhost', 'redis://foo');

const store = () => new KeyvRedis('redis://localhost');
keyvTestSuite(test, Keyv, store);
