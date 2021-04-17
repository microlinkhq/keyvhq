const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const { keyvOfficialTests } = keyvTestSuite;
const Keyv = require('this');
const KeyvMongo = require('@keyvhq/keyv-mongo');

keyvOfficialTests(test, Keyv, 'mongodb://127.0.0.1:27017', 'mongodb://127.0.0.1:1234');

const store = () => new KeyvMongo('mongodb://127.0.0.1:27017');
keyvTestSuite(test, Keyv, store);
