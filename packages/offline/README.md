# @keyvhq/offline [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> Adds offline capabilities for your keyv instance.

## Install

```bash
$ npm install @keyvhq/offline --save
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

Using `@keyvhq/offline` at the top level:

```js
const KeyvRedis = require('@keyvhq/redis')
const keyvOffline = require('@keyvhq/offline')

const keyv = keyvOffline(new KeyvRedis({
  uri: 'redis://user:pass@localhost:6379',
  maxRetriesPerRequest: 1,
  emitErrors: false
}))
```

That's all!

In the next database downtime, your keyv set/get petitions will be temporarily bypassed, preventing your application to crash for that, being more resilient than the default keyv behavior.

As soon as the connection is re-established it will be work back as expected.

In case you need, you can see omitted errors enabling debug doing `DEBUG=@keyvhq/offline*`

## License

**@keyvhq/memoize** © [Kiko Beats](https://kikobeats.com), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
