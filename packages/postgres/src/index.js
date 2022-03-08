'use strict'

const KeyvSql = require('@keyvhq/sql')
const Pool = require('pg').Pool

class KeyvPostgres extends KeyvSql {
  constructor (uri, options) {
    uri = uri || {}
    if (typeof uri === 'string') {
      uri = { uri }
    }

    if (uri.uri) {
      uri = Object.assign({ uri: uri.uri }, uri)
    }
    options = Object.assign(
      {
        dialect: 'postgres',
        uri: 'postgresql://localhost:5432'
      },
      uri,
      options
    )

    options.connect = () =>
      Promise.resolve().then(() => {
        const pool = new Pool({
          connectionString: options.uri,
          ssl: options.ssl
        })
        return sql => pool.query(sql).then(data => data.rows)
      })

    super(options)
  }
}

module.exports = KeyvPostgres
