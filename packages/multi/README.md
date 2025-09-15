# @keyvhq/multi [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/multi)

> A multi storage adapter to manage local and remote store as one for Keyv.

## Install

```shell
npm install --save @keyvhq/multi
```

## Usage

First, you need to provide your `local` and `remote` stores to be used, being possible to use any [Keyv storage adapter](https://keyvhq.js.org/#/?id=storage-adapters-1#/?id=storage-adapters-1#/?id=storage-adapters-1):

```js
const KeyvMulti = require('@keyvhq/multi')
const KeyvRedis = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvMulti({
    local: new Map(),
    remote: new KeyvRedis()
  })
})
```

After that, just interact with the store as a single [keyv](https://keyvhq.js.org/#/?id=usage#/?id=usage#/?id=usage) instance.

The actions will be performed in parallel when is possible, and the stores will fallback between them to keep them in synchronized.

## API

### multi(\[options])

#### options

##### local

Type: `Object`<br/>
Default: `new Keyv()`

A keyv instance to be used as local strategy.

##### remote

Type: `Object`<br/>
Default: `new Keyv()`

A keyv instance to be used as remote strategy.

##### validator

Type: `Function`<br/>
Default: `() =>  true`

The validator function is used as a precondition to determining is remote storage should be checked.

## License

**@keyvhq/multi** © [Jytesh](https://github.com/Jytesh), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
