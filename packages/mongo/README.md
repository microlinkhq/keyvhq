# @keyvhq/mongo [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> MongoDB storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

Uses TTL indexes to automatically remove expired documents. However [MongoDB doesn't guarantee data will be deleted immediately upon expiration](https://docs.mongodb.com/manual/core/index-ttl/#timing-of-the-delete-operation), so expiry dates are revalidated in Keyv.

## Install

```shell
npm install --save keyv @keyvhq/mongo
```

## Usage

```js
const Keyv = require('@keyvhq/core')

const keyv = new Keyv('mongodb://user:pass@localhost:27017/dbname')
keyv.on('error', handleConnectionError)
```

You can specify the collection name, by default `'keyv'` is used.

e.g:

```js
const keyv = new Keyv('mongodb://user:pass@localhost:27017/dbname', { collection: 'cache' })
```

## License

**@keyvhq/mongo** © [Luke Childs](https://lukechilds.co), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
