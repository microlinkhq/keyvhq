'use strict';

const EventEmitter = require('events');
const mongodb = require('mongodb');
const pify = require('pify');

class KeyvMongo extends EventEmitter {
	constructor(url, options) {
		super();
		this.ttlSupport = false;
		url = url || {};
		if (typeof url === 'string') {
			url = { url };
		}

		if (url.uri) {
			url = Object.assign({ url: url.uri }, url);
		}

		this.options = Object.assign({
			url: 'mongodb://127.0.0.1:27017',
			collection: 'keyv'
		}, url, options);

		this.options.mongoOptions = Object.assign({
			useNewUrlParser: true,
			useUnifiedTopology: true
		}, this.options.mongoOptions);

		try {
			this.client = new mongodb.MongoClient(this.options.url, this.options.mongoOptions);
		} catch (error) {
			this.emit('error', error);
		}

		this.mongo = {};
		let listeningEvents = false;
		// Implementation from sql by lukechilds,
		this.connect = new Promise(resolve => {
			this.client.connect()
				.then(client => {
					this.db = client.db(this.options.db);
					this.store = this.db.collection(this.options.collection);
					this.store.createIndex({ key: 1 }, {
						unique: true,
						background: true
					});
					this.store.createIndex({ expiresAt: 1 }, {
						expireAfterSeconds: 0,
						background: true
					});
					for (const method of ['updateOne', 'findOne', 'deleteOne', 'deleteMany']) {
						this.store[method] = pify(this.store[method].bind(this.store));
					}

					if (!listeningEvents) {
						this.client.on('error', error => this.emit('error', error));
						listeningEvents = true;
					}

					resolve(this.store);
				})
				.catch(error => this.emit('error', error));
		});
	}

	get(key) {
		this.connect.then(console.log);
		return this.connect
			.then(store => store.findOne({ key: { $eq: key } })
				.then(doc => {
					if (doc === null) {
						return undefined;
					}

					return doc.value;
				})
			);
	}

	set(key, value, ttl) {
		const expiresAt = (typeof ttl === 'number') ? new Date(Date.now() + ttl) : null;
		return this.connect
			.then(store => store.updateOne({ key: { $eq: key } }, { $set: { key, value, expiresAt } }, { upsert: true }));
	}

	delete(key) {
		if (typeof key !== 'string') {
			return Promise.resolve(false);
		}

		return this.connect
			.then(store => store.deleteOne({ key: { $eq: key } })
				.then(object => object.n > 0)
			);
	}

	clear() {
		return this.connect
			.then(store => store.deleteMany({ key: new RegExp(`^${this.namespace}:`) })
				.then(() => undefined));
	}
}
module.exports = KeyvMongo;
