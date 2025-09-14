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

Forked from [keyv](https://github.com/lukechilds/keyv), plus:

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

The following example is using [@keyvhq/compress](https://github.com/microlinkhq/keyvhq/tree/master/packages/compress) as serializer:

```js
const KeyvCompress = require('@keyvhq/compress')
const Keyv = require('@keyvhq/core')

const keyv = KeyvCompress(
  new Keyv({
    serialize: v8.serialize,
    deserialize: v8.deserialize
  })
)
```

## Storage adapters

**Keyv** is designed to be easily embedded into other modules to add cache support. 

Caching will work in memory by default and users have the option to also install a **Keyv** storage adapter and pass in a connection string, or any other storage that implements the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) API.

```js
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')
const got = require('got')

const cache = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379') })

await got('https://keyvhq.js.org', { cache })
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

### All the adapters

> The official storage adapters are covered by [over 150 integration tests](https://github.com/microlinkhq/keyvhq/actions/runs/949262324) to guarantee consistent behaviour. They are lightweight, efficient wrappers over the DB clients making use of indexes and native TTLs where available.

- [@keyvhq/file](https://github.com/microlinkhq/keyvhq/tree/master/packages/file) – File storage adapter for Keyv.
- [@keyvhq/mongo](https://github.com/microlinkhq/keyvhq/tree/master/packages/mongo) – MongoDB storage adapter for Keyv.
- [@keyvhq/mysql](https://github.com/microlinkhq/keyvhq/tree/master/packages/mysql) – MySQL/MariaDB storage adapter for Keyv.
- [@keyvhq/postgres](https://github.com/microlinkhq/keyvhq/tree/master/packages/postgres) – PostgreSQL storage adapter for Keyv.
- [@keyvhq/redis](https://github.com/microlinkhq/keyvhq/tree/master/packages/redis) – Redis storage adapter for Keyv.
- [@keyvhq/sqlite](https://github.com/microlinkhq/keyvhq/tree/master/packages/sqlite) – SQLite storage adapter for Keyv.

### Decorators

- [@keyvhq/compress](https://github.com/microlinkhq/keyvhq/tree/master/packages/compress) – Adds compression bindings for your Keyv instance.
- [@keyvhq/memoize](https://github.com/microlinkhq/keyvhq/tree/master/packages/memoize) – Memoize any function using Keyv as storage backend.
- [@keyvhq/multi](https://github.com/microlinkhq/keyvhq/tree/master/packages/multi) – Manages local and remote keyv stores as one.
- [@keyvhq/offline](https://github.com/microlinkhq/keyvhq/tree/master/packages/offline) – Adds offline capabilities for your keyv instance.
- [@keyvhq/stats](https://github.com/microlinkhq/keyvhq/tree/master/packages/stats) – Collects metrics for a Keyv instance over time.

### Community

> You can also use third-party storage adapters or build your own. Keyv will wrap these storage adapters in TTL functionality and handle complex types internally.

- [keyv-anyredis](https://github.com/natesilva/keyv-anyredis) - Support for Redis clusters and alternative Redis clients.
- [keyv-dynamodb](https://www.npmjs.com/package/keyv-dynamodb) - DynamoDB storage adapter for Keyv.
- [keyv-file](https://github.com/zaaack/keyv-file) - File system storage adapter for Keyv.
- [keyv-firestore ](https://github.com/goto-bus-stop/keyv-firestore) – Firebase Cloud Firestore adapter for Keyv.
- [keyv-lru](https://github.com/e0ipso/keyv-lru) – An in-memory LRU back-end for Keyv.
- [keyv-memcache](https://github.com/jaredwray/keyv-memcache) - Memcache storage adapter for Keyv.
- [keyv-mssql](https://github.com/pmorgan3/keyv-mssql) - Microsoft SQL Server adapter for Keyv.
- [keyv-s3](https://github.com/microlinkhq/keyv-s3) - Amazon S3 storage adapter for Keyv.
- [quick-lru](https://github.com/sindresorhus/quick-lru) - Simple "Least Recently Used" (LRU) cache.


## API

### constructor([options])

Returns a new Keyv instance.

#### options

Type: `Object`

The options object is also passed through to the storage adapter. Check your storage adapter docs for any extra options.

##### namespace

Type: `String`<br/>
Default: `undefined`

Namespace for the current instance.

##### ttl

Type: `Number`<br/>
Default: `undefined`

Default TTL in milliseconds. Can be overridden by specifying a TTL on `.set()`.

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

When calling clear(), on a keyv instance with no namespace, all keys are cleared.

#### .iterator()

Returns an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator), which iterates over all the key-value pairs in the namespace. When called without a namespace, it iterates over *all* entries in the database.

> The iterator shouldn't be used in environments where performance is key, or there are more than 1000 entries in the database, use an ORM or a native driver if you need to iterate over all entries.

## License

**keyv** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
