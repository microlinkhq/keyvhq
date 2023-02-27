# @keyvhq/sqlite [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

SQLite storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

## Install

```shell
npm install --save @keyvhq/core @keyvhq/sqlite
```

## Usage

```js
const KeyvSqlite = require('@keyvhq/sqlite')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvSqlite('sqlite://path/to/database.sqlite')
})
```

You can specify the `table` and [`busyTimeout`](https://sqlite.org/c3ref/busy_timeout.html) option:

```js
const KeyvSqlite = require('@keyvhq/sqlite')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({
  store: new KeyvSqlite('sqlite://path/to/database.sqlite', {
    table: 'cache',
    busyTimeout: 10000
  })
})
```

## License

**@keyvhq/sqlite** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
