# @keyvhq/compress [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> Adds compression bindings for your Keyv instance.

## Install

```bash
$ npm install @keyvhq/compress --save
```

## Usage

All you need to do is to wrap your [keyv](https://keyv.js.org) instance:

```js

const KeyvRedis = require('@keyvhq/redis')

const keyv = new KeyvRedis({
  uri: 'redis://user:pass@localhost:6379',
  maxRetriesPerRequest: 1,
  emitErrors: false
})
```

Using `@keyvhq/compress` at the top level:

```js
const KeyvCompress = require('@keyvhq/compress')
const KeyvRedis = require('@keyvhq/redis')

const keyv = KeyvCompress(new KeyvRedis({
  uri: 'redis://user:pass@localhost:6379',
  maxRetriesPerRequest: 1,
  emitErrors: false
}))
```

Additionally, it can accept [compress-brotli#options](https://github.com/Kikobeats/compress-brotli#compressbrotlioptions) as second argument:

```js
const keyv = KeyvCompress(new KeyvRedis({
  uri: 'redis://user:pass@localhost:6379',
  maxRetriesPerRequest: 1,
  emitErrors: false
}), {
  serialize: v8.serialize,
  deserialize: v8.deserialize
})
```

## License

**@keyvhq/memoize** © [Kiko Beats](https://kikobeats.com), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
