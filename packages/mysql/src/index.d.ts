import { Store } from '@keyvhq/core'

declare class KeyvMysql<TValue> implements Store<TValue> {
  constructor (uri?: string)
  constructor (options?: KeyvMysql.Options)
  constructor (uri: string, options?: KeyvMysql.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvMysql {
  interface Options {
    uri?: string | undefined
    table?: string | undefined
    keySize?: number | undefined
  }
}

export = KeyvMysql
