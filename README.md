<h1 align="center">
	<img width="250" src="/media/logo-sunset.svg" alt="keyv logo">
	<br/>
	<br/>
</h1>

![Last version](https://img.shields.io/github/tag/keyvhq/keyv.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/keyvhq/keyv.svg?style=flat-square)](https://coveralls.io/github/keyvhq/keyv)
[![NPM Status](https://img.shields.io/npm/dm/@keyvhq/keyv.svg?style=flat-square)](https://www.npmjs.org/package/@keyvhq/keyv)

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
npm install @keyvhq/keyv --save 
```

You can optionally install the storage adapter you want to use:

```bash
npm install @keyvhq/keyv-redis --save
npm install @keyvhq/keyv-mongo --save
npm install @keyvhq/keyv-sqlite --save
npm install @keyvhq/keyv-postgres --save
npm install @keyvhq/keyv-mysql --save
```

If you don't provide a specific storage adapter, a in-memory storage adapter is used by default.

## Getting Started

Just create a new Keyv instance, passing your storage adapter:

```js
const keyv = new Keyv(); // in-memory, by default
const keyvRedis = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379')})
const keyvMongo = new Keyv({ store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname')});
const keyvSQLite = new Keyv({ store: new KeyvSQLite('sqlite://path/to/database.sqlite')});
const keyvPostgreSQL = new Keyv({ store: new KeyvPostgreSQL('postgresql://user:pass@localhost:5432/dbname')});
const keyvMySQL = new Keyv({ store: new KeyvMySQL('mysql://user:pass@localhost:3306/dbname')});

// Handle DB connection errors
keyv.on('error', err => console.log('Connection Error', err));

await keyv.set('foo', 'expires in 1 second', 1000); // true
await keyv.set('foo', 'never expires'); // true
await keyv.get('foo'); // 'never expires'
await keyv.delete('foo'); // true
await keyv.clear(); // undefined
```

### Namespaces

You can namespace your Keyv instance to avoid key collisions and allow you to clear only a certain namespace while using the same database.

```js
const users = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379'), namespace: 'users' });
const cache = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379'), namespace: 'cache' });

await users.set('foo', 'users'); // true
await cache.set('foo', 'cache'); // true
await users.get('foo'); // 'users'
await cache.get('foo'); // 'cache'
await users.clear(); // undefined
await users.get('foo'); // undefined
await cache.get('foo'); // 'cache'
```

### Custom Serializers

Keyv uses [`json-buffer`](https://github.com/dominictarr/json-buffer) for data serialization to ensure consistency across different backends.

You can optionally provide your own serialization functions to support extra data types or to serialize to something other than JSON.

```js
const keyv = new Keyv({ serialize: JSON.stringify, deserialize: JSON.parse });
```

!> Using custom serializers means you lose any guarantee of data consistency. You should do extensive testing with your serialisation functions and chosen storage engine.

## Storage Adapters

### Official

The official storage adapters are covered by [over 150 integration tests](https://github.com/microlinkhq/keyv/actions/runs/949262324) to guarantee consistent behaviour. They are lightweight, efficient wrappers over the DB clients making use of indexes and native TTLs where available.

### Community

You can also use third-party storage adapters or build your own. Keyv will wrap these storage adapters in TTL functionality and handle complex types internally.

```js
const Keyv = require('@keyvhq/keyv');
const myAdapter = require('./my-storage-adapter');

const keyv = new Keyv({ store: myAdapter });
```

Any store that follows the [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) api will work.

```js
new Keyv({ store: new Map() });
```

For example, [`quick-lru`](https://github.com/sindresorhus/quick-lru) is a completely unrelated module that implements the Map API.

```js
const Keyv = require('@keyvhq/keyv');
const QuickLRU = require('quick-lru');

const lru = new QuickLRU({ maxSize: 1000 });
const keyv = new Keyv({ store: lru });
```

The following are third-party storage adapters compatible with Keyv:

- [quick-lru](https://github.com/sindresorhus/quick-lru) - Simple "Least Recently Used" (LRU) cache
- [keyv-file](https://github.com/zaaack/keyv-file) - File system storage adapter for Keyv
- [keyv-dynamodb](https://www.npmjs.com/package/keyv-dynamodb) - DynamoDB storage adapter for Keyv
- [keyv-firestore ](https://github.com/goto-bus-stop/keyv-firestore) – Firebase Cloud Firestore adapter for Keyv
- [keyv-mssql](https://github.com/pmorgan3/keyv-mssql) - Microsoft Sql Server adapter for Keyv
- [keyv-memcache](https://github.com/jaredwray/keyv-memcache) - Memcache storage adapter for Keyv

## Add Cache Support to your Module

Keyv is designed to be easily embedded into other modules to add cache support. The recommended pattern is to expose a `cache` option in your modules options which is passed through to Keyv. Caching will work in memory by default and users have the option to also install a Keyv storage adapter and pass in a connection string, or any other storage that implements the `Map` API.

You should also set a namespace for your module so you can safely call `.clear()` without clearing unrelated app data.

Inside your module:

```js
class AwesomeModule {
  constructor (opts) {
    this.cache = new Keyv({
      uri: typeof opts.cache === 'string' && opts.cache,
      store: typeof opts.cache !== 'string' && opts.cache,
      namespace: 'awesome-module'
    })
  }
}
```

Now it can be consumed like this:

```js
const AwesomeModule = require('awesome-module');

// Caches stuff in memory by default
const awesomeModule = new AwesomeModule();

// After npm install --save keyv-redis
const awesomeModule = new AwesomeModule({ cache: 'redis://localhost' });

// Some third-party module that implements the Map API
const awesomeModule = new AwesomeModule({ cache: some3rdPartyStore });
```

## API

### new Keyv([options])

Returns a new Keyv instance.

The Keyv instance is also an `EventEmitter` that will emit an `'error'` event if the storage adapter connection fails.

### options

Type: `Object`

The options object is also passed through to the storage adapter. Check your storage adapter docs for any extra options.

#### options.namespace

Type: `String`<br/>
Default: `'keyv'`

Namespace for the current instance.

#### options.ttl

Type: `Number`<br/>
Default: `undefined`

Default TTL. Can be overridden by specififying a TTL on `.set()`.

#### options.serialize

Type: `Function`<br/>
Default: `JSONB.stringify`

A custom serialization function.

#### options.deserialize

Type: `Function`<br/>
Default: `JSONB.parse`

A custom deserialization function.

#### options.store

Type: `Storage adapter instance`<br/>
Default: `new Map()`

The storage adapter instance to be used by Keyv.

#### options.adapter

Type: `String`<br/>
Default: `undefined`

Specify an adapter to use. e.g `'redis'` or `'mongodb'`.

### Instance

Keys must always be strings. Values can be of any type.

#### .set(key, value, [ttl])

Set a value.

By default keys are persistent. You can set an expiry TTL in milliseconds.

Returns a promise which resolves to `true`.

#### .get(key, [options])

Returns a promise which resolves to the retrieved value.

##### options.raw

Type: `Boolean`<br/>
Default: `false`

If set to true the raw DB object Keyv stores internally will be returned instead of just the value.

This contains the TTL timestamp.

#### .has(key)

Returns a promise which resolves to a boolean, indicating existence of a key.

#### .delete(key)

Deletes an entry.

Returns a promise which resolves to `true` if the key existed, `false` if not.

#### .clear()

Delete all entries in the current namespace.

Returns a promise which is resolved when the entries have been cleared.

```
When calling clear(), on a keyv instance with no namespace, nothing is done.
```

#### .iterator()

Returns an [Async Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator), which iterates over all the keys in the namespace.

## License

**keyv** © [Microlink](https://microlink.io), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Authored and maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
