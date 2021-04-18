const test = require('ava');
// Const keyvTestSuite = require('@keyvhq/keyv-test-suite');
// Const Keyv = require('@keyvhq/keyv');
const KeyvMongo = require('this');

require('dotenv').config();
const mongoURL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';

// Const store = () => new KeyvMongo(mongoURL);
// KeyvTestSuite(test, Keyv, store);
test('Collection option merges into default options', t => {
	const store = new KeyvMongo({ collection: 'foo' });
	t.deepEqual(store.options, {
		url: 'mongodb://127.0.0.1:27017',
		db: 'local',
		mongoOptions: {
			useNewUrlParser: true,
			useUnifiedTopology: true
		},
		collection: 'foo'
	});
});

test('Collection option merges into default options if URL is passed', t => {
	const store = new KeyvMongo(mongoURL, { collection: 'foo' });
	t.deepEqual(store.options, {
		url: mongoURL,
		db: 'local',
		mongoOptions: {
			useNewUrlParser: true,
			useUnifiedTopology: true
		},
		collection: 'foo'
	});
});
