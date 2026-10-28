'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const sqlite3 = require('@vscode/sqlite3')
const Keyv = require('@keyvhq/core')
const pify = require('pify')
const test = require('ava')

const KeyvSql = require('..')

class TestSqlite extends KeyvSql {
  constructor (options) {
    options = Object.assign(
      {
        dialect: 'sqlite',
        db: 'test/testdb.sqlite'
      },
      options
    )

    options.connect = () =>
      new Promise((resolve, reject) => {
        const db = new sqlite3.Database(options.db, error => {
          if (error) {
            reject(error)
          } else {
            db.configure('busyTimeout', 30000)
            resolve(db)
          }
        })
      }).then(db => pify(db.all).bind(db))

    super(options)
  }
}

const store = () => new TestSqlite()

keyvTestSuite(test, Keyv, store)

test.serial(
  'iterator keeps later keys after an expired key is deleted',
  async t => {
    const store = new TestSqlite({ iterationLimit: 1, table: 'keyv_pages' })
    const keyv = new Keyv({ store })
    await keyv.clear()
    await keyv.set('a', 'expired', 1)
    await keyv.set('b', 'live')
    await keyv.set('c', 'live')
    await new Promise(resolve => setTimeout(resolve, 20))
    const keys = []
    for await (const [key] of keyv.iterator()) keys.push(key)
    t.deepEqual(keys, ['b', 'c'])
  }
)
