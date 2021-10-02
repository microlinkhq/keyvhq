import Keyv = require('@keyvhq/core');
import KeyvMongo = require('..');

new Keyv({ store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname', { collection: 'cache' }) });

new KeyvMongo({ uri: 'mongodb://user:pass@localhost:27017/dbname' });
new KeyvMongo({ uri: 'mongodb://user:pass@localhost:27017/dbname', collection: 'cache' });
new KeyvMongo({ collection: 'cache' });
new KeyvMongo('mongodb://user:pass@localhost:27017/dbname');

const mongo = new KeyvMongo('mongodb://user:pass@localhost:27017/dbname');
new Keyv({ store: mongo });
