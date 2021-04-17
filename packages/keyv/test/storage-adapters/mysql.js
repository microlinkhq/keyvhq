import test from 'ava';
import keyvTestSuite, { keyvOfficialTests } from '@keyvhq/keyv-test-suite';
import Keyv from 'this';
import KeyvMysql from '@keyvhq/keyv-mysql';

keyvOfficialTests(test, Keyv, 'mysql://mysql@localhost/keyv_test', 'mysql://foo');

const store = () => new KeyvMysql('mysql://mysql@localhost/keyv_test');
keyvTestSuite(test, Keyv, store);
