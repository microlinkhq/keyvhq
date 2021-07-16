# @keyv/redis [<img width="100" align="right" src="https://ghcdn.rawgit.org/microlinkhq/keyv/master/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> Redis storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

TTL functionality is handled directly by Redis so no timestamps are stored and expired keys are cleaned up internally.

## Install

```shell
npm install --save keyv @keyv/redis
```

## Usage

```js
const Keyv = require('keyv')

const keyv = new Keyv('redis://user:pass@localhost:6379')
keyv.on('error', handleConnectionError)
```

Any valid [`Redis`](https://github.com/luin/ioredis#connect-to-redis) options will be passed directly through.

e.g:

```js
const keyv = new Keyv('redis://user:pass@localhost:6379', {
  disable_resubscribing: true
})
```

Or you can manually create a storage adapter instance and pass it to Keyv:

```js
const KeyvRedis = require('@keyv/redis')
const Keyv = require('keyv')

const keyvRedis = new KeyvRedis('redis://user:pass@localhost:6379')
const keyv = new Keyv({ store: keyvRedis })
```

Or reuse a previous Redis instance:

```js
const KeyvRedis = require('@keyv/redis')
const Redis = require('ioredis')
const Keyv = require('keyv')

const redis = new Redis('redis://user:pass@localhost:6379')
const keyvRedis = new KeyvRedis(redis)
const keyv = new Keyv({ store: keyvRedis })
```

## License

**@keyvhq/redis** © [Microlink](https://microlink.io), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Authored and maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
