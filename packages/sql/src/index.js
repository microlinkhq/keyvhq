'use strict'

const { Sql } = require('sql-ts')

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
    const select = this.entry.select().where({ key }).toString()
    return this.query(select).then(rows => {
      const row = rows[0]
      if (row === undefined) {
        return undefined
      }

      return row.value
    })
  }

  set (key, value) {
    if (this.options.dialect === 'mysql') {
      value = value.replace(/\\/g, '\\\\')
    }

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

  clear (namespace) {
    const del = this.entry
      .delete(this.entry.key.like(`${namespace ? namespace + ':' : ''}%`))
      .toString()
    return this.query(del).then(() => undefined)
  }

  async * iterator (namespace) {
    const limit = Number.parseInt(this.options.iterationLimit, 10)
    const entry = this.entry
    const pattern = `${namespace ? namespace + ':' : ''}%`
    let after

    for (;;) {
      let select = entry
        .select()
        .where(entry.key.like(pattern))
        .order(entry.key.asc())
        .limit(limit)
      if (after !== undefined) select = select.where(entry.key.gt(after))
      const entries = await this.query(select.toString())
      if (entries.length === 0) return

      for (const row of entries) {
        after = row.key
        yield [row.key, row.value]
      }
    }
  }
}

module.exports = KeyvSql
