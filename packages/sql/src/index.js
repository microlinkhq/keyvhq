'use strict'

const { Sql } = require('sql-ts')

// sql-ts inlines String objects via toString(). A primitive-only check would
// leave those literals unescaped, and value.replace used to accept them.
const isString = input => typeof input === 'string' || input instanceof String

const escapeBackslashes = input =>
  isString(input) ? input.replace(/\\/g, '\\\\') : input
const escapeLikeWildcards = input =>
  isString(input) ? input.replace(/[\\%_]/g, '\\$&') : input
const identity = input => input

class KeyvSql {
  constructor (options) {
    this.options = Object.assign(
      {
        table: 'keyv',
        keySize: 255,
        iterationLimit: 10
      },
      options
    )

    const sql = new Sql(options.dialect)
    const isMysql = options.dialect === 'mysql'
    this.escape = isMysql ? escapeBackslashes : identity
    this.escapeLike = isMysql ? escapeLikeWildcards : identity

    this.entry = sql.define({
      name: this.options.table,
      columns: [
        {
          name: 'key',
          primaryKey: true,
          dataType: `VARCHAR(${Number(this.options.keySize)})`
        },
        {
          name: 'value',
          dataType: 'TEXT'
        }
      ]
    })
    const createTable = this.entry.create().ifNotExists().toString()

    const connected = this.options
      .connect()
      .then(query => query(createTable).then(() => query))

    this.query = sqlString => connected.then(query => query(sqlString))
  }

  get (key) {
    const select = this.entry
      .select()
      .where({ key: this.escape(key) })
      .toString()
    return this.query(select).then(rows => {
      const row = rows[0]
      if (row === undefined) {
        return undefined
      }

      return row.value
    })
  }

  set (key, value) {
    key = this.escape(key)
    value = this.escape(value)
    const upsert =
      this.options.dialect === 'postgres'
        ? this.entry
          .insert({ key, value })
          .onConflict({ columns: ['key'], update: ['value'] })
          .toString()
        : this.entry.replace({ key, value }).toString()
    return this.query(upsert)
  }

  delete (key) {
    if (!key) return false
    key = this.escape(key)
    const select = this.entry.select().where({ key }).toString()
    const del = this.entry.delete().where({ key }).toString()
    return this.query(select).then(rows => {
      const row = rows[0]
      if (row === undefined) {
        return false
      }

      return this.query(del).then(() => true)
    })
  }

  namespacePattern (namespace) {
    const prefix = namespace ? this.escapeLike(namespace) + ':' : ''
    return this.escape(`${prefix}%`)
  }

  clear (namespace) {
    const pattern = this.namespacePattern(namespace)
    const del = this.entry
      .delete(this.entry.key.like(pattern))
      .toString()
    return this.query(del).then(() => undefined)
  }

  async * iterator (namespace) {
    const limit = Number.parseInt(this.options.iterationLimit, 10)
    const entry = this.entry
    const pattern = this.namespacePattern(namespace)
    async function * iterate (offset, query) {
      const selectChunk = entry
        .select()
        .where(entry.key.like(pattern))
        .limit(limit)
        .offset(offset)
        .toString()
      const entries = await query(selectChunk)
      if (entries.length === 0) {
        return
      }

      for (const entry of entries) {
        offset += 1
        yield [entry.key, entry.value]
      }

      if (offset !== '0') {
        yield * iterate(offset, query)
      }
    }

    yield * iterate(0, this.query)
  }
}

module.exports = KeyvSql
