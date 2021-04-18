const test = require('ava');
const Keyv = require('@keyvhq/keyv');
const keyvTestSuite = require('this');

const store = () => new Map();
keyvTestSuite(test, Keyv, store);
