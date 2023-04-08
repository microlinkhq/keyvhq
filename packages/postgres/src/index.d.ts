import { Store } from '@keyvhq/core'

declare class KeyvPostgres implements Store<string | undefined> {
  constructor (uri?: string)
  constructor (options?: KeyvPostgres.Options)
  constructor (uri: string, options?: KeyvPostgres.Options)

  get (key: string): Promise<string | undefined>
  has (key: string): Promise<boolean>
  set (key: string, value: string | undefined): Promise<any>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
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
