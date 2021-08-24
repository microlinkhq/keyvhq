<h1 align="center">
	<img width="250" src="/media/logo-sunset.svg" alt="keyv logo">
	<br/>
	<br/>
</h1>

![Last version](https://img.shields.io/github/tag/keyvhq/keyv.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/keyvhq/keyv.svg?style=flat-square)](https://coveralls.io/github/keyvhq/keyv)
[![NPM Status](https://img.shields.io/npm/dm/@keyvhq/core.svg?style=flat-square)](https://www.npmjs.org/package/@keyvhq/core)

> **Keyv** is a simple key-value storage with support for multiple backend adapters (MySQL, PostgreSQL, SQLite, Redis, Mongo, DynamoDB, Firestore, Memcached, and more).

## Features

- It isn't bloated.
- It supports namespaces.
- It supports TTL based expiry.
- It has a simple Promise based API.
- It handles all JSON types plus `Buffer`.
- It's support a [vary of storages](#official-storage-adapters) adapters.
- It can be [easily embed](#add-cache-support-to-your-module) inside another module.
- It works with any storage that implements the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) API.
- it handles database errors (db failures won't kill your app).
- It supports the current active LTS version of Node.js or higher.
- It's suitable as a TTL based cache or persistent key-value store.

## Installation

```bash
npm install @keyvhq/core --save 
```

You can optionally install the storage adapter you want to use:

```bash
npm install @keyvhq/redis --save
npm install @keyvhq/mongo --save
npm install @keyvhq/sqlite --save
npm install @keyvhq/postgres --save
npm install @keyvhq/mysql --save
```

If you don't provide a specific storage adapter, a in-memory storage adapter is used by default.

## Usage

Just create a new **Keyv** instance, using an specific storage adapter:

```js
const keyv = new Keyv() // in-memory, by default
const keyvRedis = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379')})
const keyvMongo = new Keyv({ store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname')})
const keyvSQLite = new Keyv({ store: new KeyvSQLite('sqlite://path/to/database.sqlite')})
const keyvPostgreSQL = new Keyv({ store: new KeyvPostgreSQL('postgresql://user:pass@localhost:5432/dbname')})
const keyvMySQL = new Keyv({ store: new KeyvMySQL('mysql://user:pass@localhost:3306/dbname')})

// Handle database connection errors
keyv.on('error', err => console.log('Connection Error', err))

await keyv.set('foo', 'expires in 1 second', 1000) // true
await keyv.set('foo', 'never expires') // true
await keyv.get('foo') // 'never expires'
await keyv.has('foo') // true
await keyv.delete('foo') // true
await keyv.has('foo') // false
await keyv.clear() // undefined
```

### Namespaces

You can namespace your **Keyv** instance to avoid key collisions and allow you to clear only a certain namespace while using the same database.

```js
const users = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379'), namespace: 'users' })
const cache = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379'), namespace: 'cache' })

await users.set('foo', 'users') // true
await cache.set('foo', 'cache') // true
await users.get('foo') // 'users'
await cache.get('foo') // 'cache'
await users.clear() // undefined
await users.get('foo') // undefined
await cache.get('foo') // 'cache'
```

### Serialization

**Keyv** uses [json-buffer](https://github.com/dominictarr/json-buffer) for data serialization to ensure consistency across different backends.

You can optionally provide your own serialization functions to support extra data types or to serialize to something other than JSON.

The following example is using [compress-brotli](https://github.com/Kikobeats/compress-brotli) as serializer:

```js
const brotli = require('compress-brotli')()
const Keyv = require('keyv')

const serialize = async ({ value, expires }) => {
  return brotli.serialize({ value: await brotli.compress(value), expires })
}

const deserialize = async data => {
  const { value, expires } = brotli.deserialize(data)
  return { value: await brotli.decompress(value), expires }
}

const keyv = new Keyv({ serialize, deserialize })
```

## Storage Adapters

**Keyv** is designed to be easily embedded into other modules to add cache support. 

Caching will work in memory by default and users have the option to also install a **Keyv** storage adapter and pass in a connection string, or any other storage that implements the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) API.

```js
const got = require('got')
const keyv = require('@keyvhq/core')
const keyvRedis = require('@keyvhq/redis')

const cache = new KeyvRedis('redis://user:pass@localhost:6379')

await got('https://keyv.js.org', { cache })
```

The recommended pattern is to expose a `cache` option in your modules options which is passed through to **Keyv**.

For example, [quick-lru](https://github.com/sindresorhus/quick-lru) is a completely unrelated module that implements the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) API.

```js
const Keyv = require('@keyvhq/core')
const QuickLRU = require('quick-lru')

const lru = new QuickLRU({ maxSize: 1000 })
const keyv = new Keyv({ store: lru })
```

You should also set a [`namespace`](#optionsnamespace) for your module so you can safely call [`.clear()`](#clear) without clearing unrelated app data.

### Official storage adapters

> The official storage adapters are covered by [over 150 integration tests](https://github.com/microlinkhq/keyv/actions/runs/949262324) to guarantee consistent behaviour. They are lightweight, efficient wrappers over the DB clients making use of indexes and native TTLs where available.

- [@keyvhq/mongo](/packages/mongo) – MongoDB storage adapter for Keyv.
- [@keyvhq/mysql](/packages/mysql) – MySQL/MariaDB storage adapter for Keyv.
- [@keyvhq/postgres](/packages/postgres) – PostgreSQL storage adapter for Keyv.
- [@keyvhq/redis](/packages/redis) – Redis storage adapter for Keyv.
- [@keyvhq/sqlite](/packages/sqlite) – SQLite storage adapter for Keyv.
- [@keyvhq/memoize](/packages/memoize) – Memoize any function using Keyv as storage backend.

### Community storage adapters

> You can also use third-party storage adapters or build your own. Keyv will wrap these storage adapters in TTL functionality and handle complex types internally.

- [keyv-anyredis](https://github.com/natesilva/keyv-anyredis) - Support for Redis clusters and alternative Redis clients.
- [keyv-dynamodb](https://www.npmjs.com/package/keyv-dynamodb) - DynamoDB storage adapter for Keyv.
- [keyv-file](https://github.com/zaaack/keyv-file) - File system storage adapter for Keyv.
- [keyv-firestore ](https://github.com/goto-bus-stop/keyv-firestore) – Firebase Cloud Firestore adapter for Keyv.
- [keyv-lru](https://github.com/e0ipso/keyv-lru) – An in-memory LRU back-end for Keyv.
- [keyv-memcache](https://github.com/jaredwray/keyv-memcache) - Memcache storage adapter for Keyv.
- [keyv-mssql](https://github.com/pmorgan3/keyv-mssql) - Microsoft SQL Server adapter for Keyv.
- [keyv-offline](https://github.com/Kikobeats/keyv-offline) – Adding offline capabilities for your keyv instance.
- [keyv-s3](https://github.com/microlinkhq/keyv-s3) - Amazon S3 storage adapter for Keyv.
- [quick-lru](https://github.com/sindresorhus/quick-lru) - Simple "Least Recently Used" (LRU) cache.


## API

### constructor([options])

Returns a new Keyv instance.

The Keyv instance is also an `EventEmitter` that will emit an `'error'` event if the storage adapter connection fails.

#### options

Type: `Object`

The options object is also passed through to the storage adapter. Check your storage adapter docs for any extra options.

##### namespace

Type: `String`<br/>
Default: `'keyv'`

Namespace for the current instance.

##### ttl

Type: `Number`<br/>
Default: `undefined`

Default TTL. Can be overridden by specififying a TTL on `.set()`.

##### serialize

Type: `Function`<br/>
Default: `JSONB.stringify`

A custom serialization function.

##### deserialize

Type: `Function`<br/>
Default: `JSONB.parse`

A custom deserialization function.

##### store

Type: `Storage adapter instance`<br/>
Default: `new Map()`

The storage adapter instance to be used by Keyv.

##### raw

Type: `Boolean`<br/>
Default: `false`

If set to true the raw DB object Keyv stores internally will be returned instead of just the value.

This contains the TTL timestamp.

### .set(key, value, [ttl])

Set a value.

By default keys are persistent. You can set an expiry TTL in milliseconds.

Returns a promise which resolves to `true`.

### .get(key, [options])

Returns a promise which resolves to the retrieved value.

### .has(key)

Returns a promise which resolves to a boolean, indicating existence of a key.

### .delete(key)

Deletes an entry.

Returns a promise which resolves to `true` if the key existed, `false` if not.

### .clear()

Delete all entries in the current namespace.

Returns a promise which is resolved when the entries have been cleared.

When calling clear(), on a keyv instance with no namespace, nothing is done.

#### .iterator()

Returns an [Async Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator), which iterates over all the keys in the namespace.

## License

**keyv** © [Luke Childs](https://lukechilds.co), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
