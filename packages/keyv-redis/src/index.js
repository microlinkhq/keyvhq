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

		const stream = this.redis.scanStream({ match: this.namespace ? `${this.namespace}:*` : undefined });

		const keys = [];
		stream.on('data', matchedKeys => keys.push(...matchedKeys));
		await pEvent(stream, 'end');
		if (keys.length > 0) {
			await this.redis.unlink(keys);
		}
	}

	async * iterator() {
		const scan = this.redis.scan.bind(this.redis);
		const get = this.redis.mget.bind(this.redis);
		async function * iterate(curs, pattern) {
			const [cursor, keys] = await scan(curs, 'MATCH', pattern);
			const values = await get(keys);
			for (const i in keys) {
				if (Object.prototype.hasOwnProperty.call(keys, i)) {
					const key = keys[i];
					const value = values[i];
					yield [key, value];
				}
			}

			if (cursor !== '0') {
				yield * iterate(cursor, pattern);
			}
		}

		yield * iterate(0, `${this.namespace ? this.namespace + ':' : ''}*`);
	}
}

module.exports = KeyvRedis;
