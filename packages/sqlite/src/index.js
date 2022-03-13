'use strict'

const sqlite3 = require('@vscode/sqlite3')
const KeyvSql = require('@keyvhq/sql')
const pify = require('pify')

class KeyvSqlite extends KeyvSql {
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
        dialect: 'sqlite',
        uri: 'sqlite://:memory:'
      },
      uri,
      options
    )
    options.db = options.uri.replace(/^sqlite:\/\//, '')

    options.connect = () =>
      new Promise((resolve, reject) => {
        const db = new sqlite3.Database(options.db, error => {
          if (error) {
            reject(error)
          } else {
            if (options.busyTimeout) {
              db.configure('busyTimeout', options.busyTimeout)
            }

            resolve(db)
          }
        })
      }).then(db => pify(db.all).bind(db))

    super(options)
  }
}

module.exports = KeyvSqlite
