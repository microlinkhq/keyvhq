// Type definitions for @keyv/postgres 1.0
// Project: https://github.com/lukechilds/keyv-postgres
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

import { Store } from '@keyvhq/core'
import { EventEmitter } from 'events'

declare class KeyvPostgres extends EventEmitter implements Store<string | undefined> {
  readonly ttlSupport: false
  namespace?: string | undefined

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
