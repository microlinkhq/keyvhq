# @keyvhq/max-size [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyvhq/tree/master/packages/max-size)

> Prevents storing entries larger than a configured size in your Keyv instance.

## Install

```bash
$ npm install @keyvhq/max-size --save
```

## Usage

Wrap your [keyv](https://keyvhq.js.org) instance:

```js
const Keyv = require('@keyvhq/core')
const KeyvRedis = require('@keyvhq/redis')
const KeyvMaxSize = require('@keyvhq/max-size')

const keyv = KeyvMaxSize(
  new Keyv({
    store: new KeyvRedis('redis://user:pass@localhost:6379')
  }),
  { maxSize: 1024 * 1024 } // required
)
```

Values larger than `maxSize` are skipped and `.set()` resolves to `true`, preserving default Keyv behavior for callers.

You can use it with [`bytes`](https://www.npmjs.com/package/bytes):

```js
const bytes = require('bytes')

const keyv = KeyvMaxSize(new Keyv({ store }), {
  maxSize: bytes('1KB')
})
```

## API

### KeyvMaxSize(keyv, [options])

#### options.maxSize

Type: `number`  
Required: `true`

Maximum serialized entry size in bytes.

#### options.size

Type: `(value, key) => number | Promise<number>`  
Default: internal byte length calculator

Custom byte size calculator.

#### options.onSkip

Type: `(context) => void | Promise<void>`

Hook executed when a key is skipped due to size limit.

## License

**@keyvhq/max-size** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
