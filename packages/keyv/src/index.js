'use strict';

const EventEmitter = require('events');
const JSONB = require('json-buffer');

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

		this.store = this.options.store || new Map();

		if (typeof this.store.on === 'function') {
			this.store.on('error', error => this.emit('error', error));
		}

		this.store.namespace = this.options.namespace;
	}

	_getKeyPrefix(key) {
		return `${this.options.namespace}:${key}`;
	}

	get(key, options) {
		const keyPrefixed = this._getKeyPrefix(key);
		const store = this.store;
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

	has(key) {
		const keyPrefixed = this._getKeyPrefix(key);
		const store = this.store;
		if (typeof store.has === 'function') {
			return Promise.resolve()
				.then(() => store.has(keyPrefixed));
		}

		return Promise.resolve()
			.then(() => store.get(keyPrefixed))
			.then(data => data !== undefined);
	}

	set(key, value, ttl) {
		const keyPrefixed = this._getKeyPrefix(key);
		if (typeof ttl === 'undefined') {
			ttl = this.options.ttl;
		}

		if (ttl === 0) {
			ttl = undefined;
		}

		const store = this.store;

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
		const store = this.store;
		return Promise.resolve()
			.then(() => store.delete(keyPrefixed));
	}

	clear() {
		const store = this.store;
		return Promise.resolve()
			.then(() => store.clear());
	}
}

module.exports = Keyv;
