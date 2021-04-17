import test from 'ava';
import keyvTestSuite, { keyvOfficialTests } from 'test-suite';
import Keyv from 'this';
import KeyvRedis from 'redis';

keyvOfficialTests(test, Keyv, 'redis://localhost', 'redis://foo');

const store = () => new KeyvRedis('redis://localhost');
keyvTestSuite(test, Keyv, store);
