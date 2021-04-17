'use strict';

const EventEmitter = require('events');
const JSONB = require('json-buffer');

const loadStore = options => {
	const adapters = {
		redis: '@keyvhq/keyv-redis',
		mongodb: '@keyvhq/keyv-mongo',
		mongo: '@keyvhq/keyv-mongo',
		sqlite: '@keyvhq/keyv-sqlite',
		postgresql: '@keyvhq/keyv-postgres',
		postgres: '@keyvhq/keyv-postgres',
		mysql: '@keyvhq/keyv-mysql'
	};
	if (options.adapter || options.uri) {
		const adapter = options.adapter || /^[^:]*/.exec(options.uri)[0];
		return new (require(adapters[adapter]))(options);
	}

	return new Map();
};

class Keyv extends EventEmitter {
	constructor(uri, options) {
		super();
		this.options = Object.assign(
			{
				namespace: 'keyv',
				serialize: JSONB.stringify,
				deserialize: JSONB.parse
			},
			(typeof uri === 'string') ? { uri } : uri,
			options
		);

		if (!this.options.store) {
			const adapteroptions = Object.assign({}, this.options);
			this.options.store = loadStore(adapteroptions);
		}

		if (typeof this.options.store.on === 'function') {
			this.options.store.on('error', error => this.emit('error', error));
		}

		this.options.store.namespace = this.options.namespace;
	}

	_getKeyPrefix(key) {
		return `${this.options.namespace}:${key}`;
	}

	get(key, options) {
		const keyPrefixed = this._getKeyPrefix(key);
		const { store } = this.options;
		return Promise.resolve()
			.then(() => store.get(keyPrefixed))
			.then(data => {
				return (typeof data === 'string') ? this.options.deserialize(data) : data;
			})
			.then(data => {
				if (data === undefined) {
					return undefined;
				}

				if (typeof data.expires === 'number' && Date.now() > data.expires) {
					this.delete(key);
					return undefined;
				}

				return (options && options.raw) ? data : data.value;
			});
	}

	set(key, value, ttl) {
		const keyPrefixed = this._getKeyPrefix(key);
		if (typeof ttl === 'undefined') {
			ttl = this.options.ttl;
		}

		if (ttl === 0) {
			ttl = undefined;
		}

		const { store } = this.options;

		return Promise.resolve()
			.then(() => {
				const expires = (typeof ttl === 'number') ? (Date.now() + ttl) : null;
				value = { value, expires };
				return this.options.serialize(value);
			})
			.then(value => store.set(keyPrefixed, value, ttl))
			.then(() => true);
	}

	delete(key) {
		const keyPrefixed = this._getKeyPrefix(key);
		const { store } = this.options;
		return Promise.resolve()
			.then(() => store.delete(keyPrefixed));
	}

	clear() {
		const { store } = this.options;
		return Promise.resolve()
			.then(() => store.clear());
	}
}

module.exports = Keyv;
