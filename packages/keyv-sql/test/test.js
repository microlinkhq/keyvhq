const test = require('ava');
const keyvTestSuite = require('@keyvhq/keyv-test-suite');
const Keyv = require('@keyvhq/keyv');
const KeyvSql = require('this');

const sqlite3 = require('sqlite3');
const pify = require('pify');

class TestSqlite extends KeyvSql {
	constructor(options) {
		options = Object.assign({
			dialect: 'sqlite',
			db: 'test/testdb.sqlite'
		}, options);

		options.connect = () => new Promise((resolve, reject) => {
			const db = new sqlite3.Database(options.db, error => {
				if (error) {
					reject(error);
				} else {
					db.configure('busyTimeout', 30000);
					resolve(db);
				}
			});
		})
			.then(db => pify(db.all).bind(db));

		super(options);
	}
}

const store = () => new TestSqlite();
keyvTestSuite(test, Keyv, store);

test('Async Iterator', async t => {
	const keyv = new Keyv({ store: store() });
	await keyv.set('foo', 'bar');
	const iterator = keyv.options.store.iterator();
	for await (const key of iterator) {
		console.log(key);
		t.assert(key, 'foo');
	}
});
