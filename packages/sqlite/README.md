# @keyv/sqlite [<img width="100" align="right" src="https://ghcdn.rawgit.org/microlinkhq/keyv/master/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

SQLite storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

## Install

```shell
npm install --save keyv @keyv/sqlite
```

## Usage

```js
const Keyv = require('keyv')

const keyv = new Keyv('sqlite://path/to/database.sqlite')
keyv.on('error', handleConnectionError)
```

You can specify the `table` and [`busyTimeout`](https://sqlite.org/c3ref/busy_timeout.html) option.

e.g:

```js
const keyv = new Keyv('sqlite://path/to/database.sqlite', {
  table: 'cache',
  busyTimeout: 10000
})
```

## License

**@keyvhq/sqlite** © [Microlink](https://microlink.io), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Authored and maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
