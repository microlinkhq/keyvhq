'use strict'

const { Sql } = require('sql-ts')

// sql-ts quotes strings, String objects, array elements, and other objects
// (toString(), or JSON.stringify when toString is the default). MySQL then
// reads \ as an escape inside that literal. value.replace used to accept
// String objects and throw on everything else.
const doubleBackslashes = text => String(text).replace(/\\/g, '\\\\')

const escapeBackslashes = input => {
  if (typeof input === 'string') return doubleBackslashes(input)
  if (input == null || typeof input !== 'object') return input
  if (Buffer.isBuffer(input) || input instanceof Date) return input
  if (Array.isArray(input)) return input.map(escapeBackslashes)
  const strValue = input.toString()
  const literal = strValue === '[object Object]' ? JSON.stringify(input) : strValue
  return doubleBackslashes(literal)
}

// String() matches the text `${namespace}` stored, including numbers and objects.
const escapeLikeWildcards = input => String(input).replace(/[\\%_]/g, '\\$&')
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
    const dialect = options.dialect
    // MySQL string literals treat \ as an escape, so keys and values are
    // escaped twice for LIKE: once for the pattern, then again for the
    // literal. Postgres LIKE uses \ as its default escape and does not
    // treat \ specially inside a standard string. SQLite needs an explicit
    // ESCAPE clause; its string literals leave \ alone.
    this.escape = dialect === 'mysql' ? escapeBackslashes : identity
    this.escapeLike = ['mysql', 'postgres', 'sqlite'].includes(dialect)
      ? escapeLikeWildcards
      : identity
    this.likeEscape = dialect === 'sqlite' ? '\\' : ''

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
    if (!namespace) return this.escape('%')
    const prefix = this.escapeLike(namespace) + ':'
    return this.escape(`${prefix}%`)
  }

  whereLike (pattern) {
    const like = this.entry.key.like(pattern)
    if (!this.likeEscape) return like
    // sql-ts cannot emit an ESCAPE clause. The comparison is parenthesized.
    const comparison = like.toString()
    return `${comparison.slice(0, -1)} ESCAPE '${this.likeEscape}')`
  }

  clear (namespace) {
    const pattern = this.namespacePattern(namespace)
    const del = this.entry
      .delete(this.whereLike(pattern))
      .toString()
    return this.query(del).then(() => undefined)
  }

  async * iterator (namespace) {
    const limit = Number.parseInt(this.options.iterationLimit, 10)
    const entry = this.entry
    const pattern = this.namespacePattern(namespace)
    const like = this.whereLike(pattern)
    async function * iterate (offset, query) {
      const selectChunk = entry
        .select()
        .where(like)
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
