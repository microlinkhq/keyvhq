# @keyvhq/compress [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyvhq)

> Adds compression bindings for your Keyv instance.

## Install

```bash
$ npm install @keyvhq/compress --save
```

## Usage

All you need to do is to wrap your [keyv](https://keyvhq.js.org) instance:

```js
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const store = new KeyvRedis({
  uri: 'redis://user:pass@localhost:6379',
  maxRetriesPerRequest: 1,
  emitErrors: false
})

const keyv = new Keyv({ store })
```

Using `@keyvhq/compress` at the top level:

```js
const KeyvCompress = require('@keyvhq/compress')
const keyv = KeyvCompress(new Keyv({ store }))
```

Additionally, it can accept [compress-brotli#options](https://github.com/Kikobeats/compress-brotli#compressbrotlioptions) as second argument:

```js
const keyv = KeyvCompress(
  new Keyv({ store }),
  {
    serialize: v8.serialize,
    deserialize: v8.deserialize
  }
)
```

## License

**@keyvhq/memoize** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
