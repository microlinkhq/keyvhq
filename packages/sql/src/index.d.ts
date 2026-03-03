import { Store } from '@keyvhq/core'

declare class KeyvSql<TValue = any> implements Store<TValue> {
  constructor (options?: KeyvSql.Options)
  get (key: string): Promise<TValue | undefined>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (namespace?: string): Promise<void>
  iterator (namespace?: string): AsyncGenerator<[string, TValue]>
}

declare namespace KeyvSql {
  type Dialect = 'mysql' | 'postgres' | 'sqlite' | 'mssql'

  interface Options {
    /** SQL dialect to use: mysql, postgres, sqlite, or mssql */
    dialect: Dialect
    /** Function to execute queries. Should return a Promise that resolves with query results. */
    connect: () => Promise<(sqlString: string) => Promise<unknown[]>>
    /** Table name for keyv storage. Default: 'keyv' */
    table?: string
    /** Size of the key column. Default: 255 */
    keySize?: number
    /** Maximum number of entries to fetch per iteration. Default: 10 */
    iterationLimit?: number
  }
}

export = KeyvSql
