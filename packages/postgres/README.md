# @keyvhq/postgres [<img width="100" align="right" src="https://keyv.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> PostgreSQL storage adapter for [Keyv](https://github.com/microlinkhq/keyv).

Requires Postgres 9.5 or newer for `ON CONFLICT` support to allow performant upserts. [Why?](https://stackoverflow.com/questions/17267417/how-to-upsert-merge-insert-on-duplicate-update-in-postgresql/17267423#17267423)

## Install

```shell
npm install --save @keyvhq/core @keyvhq/postgres
```

## Usage

```js
const KeyvPostgres = require('@keyvhq/postgres')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({ 
    store: new KeyvPostgres({
        uri: 'postgresql://user:pass@localhost:5432/dbname',
        ssl: {
            rejectUnauthorized: false
        }
    })
})

keyv.on('error', handleConnectionError)
```

You can specify the `table` option:

```js
const KeyvPostgres = require('@keyvhq/postgres')
const Keyv = require('@keyvhq/core')

const keyv = new Keyv({ 
  store: new KeyvPostgres('postgresql://user:pass@localhost:5432/dbname', {
    table: 'cache'
  })
})
```

## License

**@keyvhq/postgres** © [Luke Childs](https://lukechilds.co), released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
