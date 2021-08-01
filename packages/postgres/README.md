# @keyvhq/postgres [<img width="100" align="right" src="https://ghcdn.rawgit.org/microlinkhq/keyv/master/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> PostgreSQL storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

Requires Postgres 9.5 or newer for `ON CONFLICT` support to allow performant upserts. [Why?](https://stackoverflow.com/questions/17267417/how-to-upsert-merge-insert-on-duplicate-update-in-postgresql/17267423#17267423)

## Install

```shell
npm install --save keyv @keyvhq/postgres
```

## Usage

```js
const Keyv = require('keyv')

const keyv = new Keyv('postgresql://user:pass@localhost:5432/dbname')
keyv.on('error', handleConnectionError)
```

You can specify the `table` option.

e.g:

```js
const keyv = new Keyv('postgresql://user:pass@localhost:5432/dbname', { table: 'cache' })
```

## License

**@keyvhq/postgres** © [Microlink](https://microlink.io), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Authored and maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
