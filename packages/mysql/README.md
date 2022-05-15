# @keyvhq/mysql [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> MySQL/MariaDB storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

## Install

```shell
npm install --save @keyvhq/core @keyvhq/mysql
```

## Usage

```js
const KeyvMysql = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({ 
  store: new KeyvMysql('mysql://user:pass@localhost:3306/dbname')
})

keyv.on('error', handleConnectionError)
```

You can specify a custom table with the `table` option and the primary key size with `keySize`:

```js
const KeyvMysql = require('@keyvhq/redis')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({ 
  store: new KeyvMysql('mysql://user:pass@localhost:3306/dbname', {
    table: 'cache',
    keySize: 255
  })
})
```

**Note:** Some MySQL/MariaDB installations won't allow a key size longer than 767 bytes. If you get an error on table creation try reducing `keySize` to 191 or lower.

## License

**@keyvhq/mysql** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
