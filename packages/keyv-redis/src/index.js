'use strict';

const EventEmitter = require('events');
const pEvent = require('p-event');
const Redis = require('ioredis');

class KeyvRedis extends EventEmitter {
	constructor(uri, options) {
		super();

		if (uri instanceof Redis) {
			this.redis = uri;
		} else {
			options = Object.assign(
				{},
				typeof uri === 'string' ? { uri } : uri,
				options
			);
			this.redis = new Redis(options.uri, options);
		}

		this.redis.on('error', error => this.emit('error', error));
	}

	async _getAll({ onlyKeys = false } = {}) {
		const stream = this.redis.scanStream({ match: `${this.namespace}*` });
		const mget = this.redis.mget.bind(this.redis);
		const data = [];

		stream.on('data', async matchedKeys => {
			if (onlyKeys) {
				data.push(...matchedKeys);
			} else {
				const values = await mget(matchedKeys);
				data.push(...matchedKeys.map((key, index) => ([key, values[index]])));
			}
		});

		await pEvent(stream, 'end');
		return data;
	}

	async get(key) {
		const value = await this.redis.get(key);
		return value === null ? undefined : value;
	}

	async set(key, value, ttl) {
		if (typeof value === 'undefined') {
			return undefined;
		}

		return typeof ttl === 'number' ?
			this.redis.set(key, value, 'PX', ttl) :
			this.redis.set(key, value);
	}

	async delete(key) {
		const result = await this.redis.unlink(key);
		return result > 0;
	}

	async clear() {
		if (this.namespace === undefined) {
			await this.redis.flushall();
			return undefined;
		}

		const keys = await this._getAll({ onlyKeys: true });
		if (keys.length > 0) await this.redis.unlink(keys);
	}

	async * iterator() {
		const data = await this._getAll();
		for (const item in data) {
			if (Object.prototype.hasOwnProperty.call(data, item)) {
				yield item;
			}
		}
	}
}

module.exports = KeyvRedis;
