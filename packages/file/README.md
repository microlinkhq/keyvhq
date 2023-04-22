# @keyvhq/file [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/file)

> A file storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

## Install

```shell
npm install --save @keyvhq/core @keyvhq/file
```

## Usage

```js
const KeyvFile = require('@keyvhq/file')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvFile('./myfile')
})
```

## License

**@keyvhq/file** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
