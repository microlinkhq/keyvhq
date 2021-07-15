'use strict'

const EventEmitter = require('events')
class KeyvSql extends EventEmitter {
  constructor (options) {
    super()
    this.ttlSupport = false

    this.options = Object.assign(
      {
        table: 'keyv',
        keySize: 255,
        iterationLimit: 10
      },
      options
    )

    const createTable =
      this.options.dialect === 'mysql'
        ? `CREATE TABLE IF NOT EXISTS \`${this.options.table}\` (\`key\` VARCHAR(${this.options.keySize}) PRIMARY KEY, \`value\` TEXT)`
        : `CREATE TABLE IF NOT EXISTS "${this.options.table}" ("key" VARCHAR(${this.options.keySize}) PRIMARY KEY, "value" TEXT)`

    const connected = this.options
      .connect()
      .then(query => query(createTable).then(() => query))
      .catch(error => {
        if (this.options.emitErrors && typeof this.store.on === 'function') {
          this.emit('error', error)
        }
      })

    this.query = sqlString => connected.then(query => query(sqlString))
  }

  get (key) {
    const select =
      this.options.dialect === 'mysql'
        ? `SELECT \`${this.options.table}\`.* FROM \`${this.options.table}\` WHERE (\`${this.options.table}\`.\`key\` = '${key}')`
        : `SELECT "${this.options.table}".* FROM "${this.options.table}" WHERE ("${this.options.table}"."key" = '${key}')`
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
        ? `INSERT INTO "${this.options.table}" ("key", "value") VALUES ('${key}', '${value}') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`
        : this.options.dialect === 'mysql'
        ? `REPLACE INTO \`${this.options.table}\` (\`key\`, \`value\`) VALUES ('${key}', '${value}')`
        : `REPLACE INTO "${this.options.table}" ("key", "value") VALUES ('${key}', '${value}')`

    return this.query(upsert)
  }

  delete (key) {
    const select =
      this.options.dialect === 'mysql'
        ? `SELECT \`${this.options.table}\`.* FROM \`${this.options.table}\` WHERE (\`${this.options.table}\`.\`key\` = '${key}')`
        : `SELECT "${this.options.table}".* FROM "${this.options.table}" WHERE ("${this.options.table}"."key" = '${key}')`
    const del =
      this.options.dialect === 'mysql'
        ? `DELETE FROM \`${this.options.table}\` WHERE (\`${this.options.table}\`.\`key\` = '${key}')`
        : `DELETE FROM "${this.options.table}" WHERE ("${this.options.table}"."key" = '${key}')`
    return this.query(select).then(rows => {
      const row = rows[0]
      if (row === undefined) {
        return false
      }

      return this.query(del).then(() => true)
    })
  }

  clear () {
    const del =
      this.options.dialect === 'mysql'
        ? `DELETE FROM \`${this.options.table}\` WHERE (\`${
            this.options.table
          }\`.\`key\` LIKE '${this.namespace ? this.namespace + ':' : ''}%')`
        : `DELETE FROM "${this.options.table}" WHERE ("${
            this.options.table
          }"."key" LIKE '${this.namespace ? this.namespace + ':' : ''}%')`
    return this.query(del).then(() => undefined)
  }

  async * iterator () {
    const limit = Number.parseInt(this.options.iterationLimit, 10)
    const selectChunk =
      this.options.dialect === 'mysql'
        ? `SELECT * FROM \`${this.options.table}\` WHERE (\`${
            this.options.table
          }\`.\`key\` LIKE '${
            this.namespace ? this.namespace + ':' : ''
          }%') LIMIT ${limit} OFFSET `
        : `SELECT * FROM "${this.options.table}" WHERE ("${
            this.options.table
          }"."key" LIKE '${
            this.namespace ? this.namespace + ':' : ''
          }%') LIMIT ${limit} OFFSET `

    async function * iterate (offset, query) {
      const entries = await query(selectChunk + offset)
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
