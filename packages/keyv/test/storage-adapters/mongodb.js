const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const Keyv = require('this');
const KeyvMongo = require('@keyvhq/keyv-mongo');

const store = () => new KeyvMongo('mongodb://127.0.0.1:27017');
keyvTestSuite(test, Keyv, store);
