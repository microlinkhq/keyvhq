import { Store } from '@keyvhq/core'

declare class KeyvMongo<TValue> implements Store<TValue> {
  constructor (uri?: string)
  constructor (options?: KeyvSqlite.Options)
  constructor (uri: string, options?: KeyvSqlite.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (namespace?: string): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvSqlite {
  interface Options {
    uri?: string | undefined
    busyTimeout?: number | undefined
    table?: string | undefined
    keySize?: number | undefined
  }
}

export = KeyvSqlite
