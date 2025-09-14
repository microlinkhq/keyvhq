# @keyvhq/offline [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/offline)

> Adds offline capabilities for your keyv instance.

## Install

```bash
$ npm install @keyvhq/offline --save
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

Using `@keyvhq/offline` at the top level:

```js
const KeyvOffline = require('@keyvhq/offline')
const keyv = keyvOffline(new Keyv({ store }))
```

Since now, if your store suffers network connectivity issues, your keyv set/get petitions will be temporarily bypassed, preventing your application to crash for that, being more resilient than the default keyv behavior.

As soon as the connection is re-established, it will be work back as expected.

In case you need, you can see omitted errors enabling debug doing `DEBUG=@keyvhq/offline*`

## License

**@keyvhq/memoize** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
