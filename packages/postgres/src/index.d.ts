import { Store } from '@keyvhq/core'

declare class KeyvPostgres implements Store<TValue> {
  constructor (uri?: string)
  constructor (options?: KeyvPostgres.Options)
  constructor (uri: string, options?: KeyvPostgres.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (namespace?: string): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvPostgres {
  interface Options {
    uri?: string | undefined
    table?: string | undefined
    keySize?: number | undefined
  }
}

export = KeyvPostgres
