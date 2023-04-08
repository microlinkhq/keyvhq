import { Store } from '@keyvhq/core'

declare class KeyvSqlite implements Store<string | undefined> {
  constructor (uri?: string)
  constructor (options?: KeyvSqlite.Options)
  constructor (uri: string, options?: KeyvSqlite.Options)

  get (key: string): Promise<string | undefined>
  has (key: string): Promise<boolean>
  set (key: string, value: string | undefined): Promise<any>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
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
