const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const Keyv = require('this');
const KeyvRedis = require('redis');

const store = () => new KeyvRedis('redis://localhost');
keyvTestSuite(test, Keyv, store);
