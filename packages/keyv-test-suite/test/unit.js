const test = require('ava');
const Keyv = require('keyv');
const keyvTestSuite= require('this');

// KeyvOfficialTests(test, Keyv, 'sqlite://test/testdb.sqlite', 'sqlite://non/existent/database.sqlite');

const store = () => new Map();
keyvTestSuite(test, Keyv, store);
