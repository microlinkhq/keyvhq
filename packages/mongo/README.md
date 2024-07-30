# @keyvhq/mongo [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/mongo)

> MongoDB storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

Uses TTL indexes to automatically remove expired documents. However [MongoDB doesn't guarantee data will be deleted immediately upon expiration](https://docs.mongodb.com/manual/core/index-ttl/#timing-of-the-delete-operation), so expiry dates are revalidated in Keyv.

## Install

```shell
npm install --save @keyvhq/core @keyvhq/mongo
```

## Usage

> **NOTE**: The mongo uses `url` instead of `uri` to provide the connection string details.

```js
const KeyvMongo = require('@keyvhq/mongo')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname')
})
```

You can specify the collection name, by default `'keyv'` is used:

```js
const KeyvMongo = require('@keyvhq/mongo')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname', {
    collection: 'cache'
  })
})
```

## License

**@keyvhq/mongo** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
