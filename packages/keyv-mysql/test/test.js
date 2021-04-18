const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const Keyv = require('@keyvhq/keyv');
const KeyvMysql = require('this');

require('dotenv').config();
const dbUrl = process.env.MYSQL_URL || 'mysql://root:root@localhost/keyv_test';
const store = () => new KeyvMysql(dbUrl);
keyvTestSuite(test, Keyv, store);
