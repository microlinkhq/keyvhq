# @keyvhq/stats [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/stats)

> Collects metrics for a Keyv instance over time.

## Install

```shell
npm install --save @keyvhq/stats
```

## Usage

Wrap your keyv instance with `@keyvhq/stats`:

```js
const KeyvStats = require('@keyvhq/stats')
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = KeyvStats(new Keyv({ store: new KeyvRedis() }))
```

That adds some methods for getting stats over your keyv instance:

```js
await keyv.get('foo')

keyv.stats.info()
// => {
//   hit: { value: 0, percent: '0%' },
//   miss: { value: 1, percent: '100%' },
//   total: 1
// }

await keyv.set('foo', 'bar')
await keyv.get('foo')
await keyv.get('foo')

keyv.stats.info()
// => {
//   hit: { value: 2, percent: '67%' },
//   miss: { value: 1, percent: '33%' },
//   total: 3
// }

keyv.stats.reset()
```

## API

### stats(\[options])

#### options

##### interval

Type: `number`<br/>
Default: `1500`

After that interval, a `stats.save()` will be performed.

##### key

Type: `string`<br/>
Default: `'__internal_stats__'`

The key used for storing the stats inside the store.

### .stats.info()

Returns the collected stats for the store in the shape:

```
{
  hit: {
    value: number
    percent: string
  },
  miss: {
    value: number
    percent: string
  }
  total: number
}
```

### .stats.reset()

Resets the stats counters.

### .stats.save()

Peforms a save of the current buffered stats into the store.

## License

**@keyvhq/stats** © [Jytesh](https://github.com/Jytesh), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
