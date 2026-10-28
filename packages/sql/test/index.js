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

test.serial('mysql sends a buffer as a hex literal', async t => {
  const queries = []
  const db = new KeyvSql({
    dialect: 'mysql',
    connect: () => Promise.resolve(async sql => {
      queries.push(sql)
      return []
    })
  })
  await db.set('k', Buffer.from([0xff]))
  t.true(queries.some(sql => sql.includes("x'ff'")))
})

keyvTestSuite(test, Keyv, store)

test.serial('a backslash value is stored verbatim', async t => {
  const keyv = new Keyv({ store: new TestSqlite({ table: 'keyv_backslash' }) })
  await keyv.clear()
  await keyv.set('a\\b', 'a\\b')
  t.is(await keyv.get('a\\b'), 'a\\b')
  await keyv.clear()
})

test.serial('clear and iterator match the namespace literally', async t => {
  const db = new TestSqlite({ table: 'keyv_like' })
  const namespaces = ['a\\b', 'ab', 'n%', 'nX', 'u_', 'uX']
  const keyvs = Object.fromEntries(namespaces.map(namespace => [namespace, new Keyv({ store: db, namespace })]))
  await db.clear()

  for (const namespace of namespaces) await keyvs[namespace].set('k', namespace)

  for (const namespace of ['a\\b', 'n%', 'u_']) {
    const entries = []
    for await (const entry of keyvs[namespace].iterator()) entries.push(entry)
    t.deepEqual(entries, [['k', namespace]], `iterator(${namespace})`)
    await keyvs[namespace].clear()
  }

  t.is(await keyvs['a\\b'].get('k'), undefined)
  t.is(await keyvs.ab.get('k'), 'ab')
  t.is(await keyvs['n%'].get('k'), undefined)
  t.is(await keyvs.nX.get('k'), 'nX')
  t.is(await keyvs.u_.get('k'), undefined)
  t.is(await keyvs.uX.get('k'), 'uX')
  await db.clear()
})
