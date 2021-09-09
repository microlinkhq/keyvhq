# @keyvhq/mysql [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> MySQL/MariaDB storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

## Install

```shell
npm install --save keyv @keyvhq/mysql
```

## Usage

```js
const Keyv = require('@keyvhq/core')

const keyv = new Keyv('mysql://user:pass@localhost:3306/dbname')
keyv.on('error', handleConnectionError)
```

You can specify a custom table with the `table` option and the primary key size with `keySize`.

e.g:

```js
const keyv = new Keyv('mysql://user:pass@localhost:3306/dbname', {
  table: 'cache',
  keySize: 255
})
```

**Note:** Some MySQL/MariaDB installations won't allow a key size longer than 767 bytes. If you get an error on table creation try reducing `keySize` to 191 or lower.

## License

**@keyvhq/mysql** © [Luke Childs](https://lukechilds.co), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
