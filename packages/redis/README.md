# @keyvhq/redis [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/redis)

> Redis storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

TTL functionality is handled directly by Redis so no timestamps are stored and expired keys are cleaned up internally.

## Install

```shell
npm install --save @keyvhq/core @keyvhq/redis
```

## Usage

```js
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({ store: new KeyvRedis('redis://user:pass@localhost:6379') })
```

Any valid [`Redis`](https://github.com/luin/ioredis#connect-to-redis) options will be passed directly through:

```js
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvRedis('redis://user:pass@localhost:6379', {
    disable_resubscribing: true
  })
})
```

Or you can reuse a previously declared `Redis` instance:

```js
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const { Redis } = KeyvRedis

const redis = new Redis('redis://user:pass@localhost:6379')
const keyv = new Keyv({ store: new KeyvRedis(redis) })
```

## License

**@keyvhq/redis** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
