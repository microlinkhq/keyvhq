'use strict';

const EventEmitter = require('events');
const JSONB = require('json-buffer');

class Keyv extends EventEmitter {
	constructor(options) {
		super();
		this.options = Object.assign(
			{
				namespace: 'keyv',
				serialize: JSONB.stringify,
				deserialize: JSONB.parse
			},
			options
		);

		this.store = this.options.store;
		this.store.namespace = this.options.namespace;

		if (!this.store) {
			this.store = new Map();
		}

		if (typeof this.store.on === 'function') {
			this.store.on('error', error => this.emit('error', error));
		}

		const generateIterator = iterator => async function * () {
			for await (const [key, raw] of (typeof iterator === 'function' ? iterator() : iterator)) {
				const data = (typeof raw === 'string') ? this.options.deserialize(raw) : raw;
				if (!key.includes(this.options.namespace) || typeof data !== 'object') {
					continue;
				}

				if (typeof data.expires === 'number' && Date.now() > data.expires) {
					this.delete(key);
					continue;
				}

				yield [this._getKeyUnprefix(key), data.value];
			}
		};

		// Attach iterators
		if (typeof this.store[Symbol.iterator] === 'function' && this.store instanceof Map) {
			this.iterator = generateIterator(this.store);
		} else if (typeof this.store.iterator === 'function') {
			this.iterator = generateIterator(this.store.iterator.bind(this.store));
		} else {
			this.iteratorSupport = false;
		}
	}

	_getKeyPrefix(key) {
		return this.options.namespace ? `${this.options.namespace}:${key}` : key;
	}

	_getKeyUnprefix(key) {
		return this.options.namespace ? key.split(':').splice(1).join(':') : key;
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
