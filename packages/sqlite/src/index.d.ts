// Type definitions for @keyv/sqlite 2.0
// Project: https://github.com/lukechilds/keyv-sqlite
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

import { Store } from '@keyvhq/core'
import { EventEmitter } from 'events'

declare class KeyvSqlite extends EventEmitter implements Store<string | undefined> {
  readonly ttlSupport: false
  namespace?: string | undefined

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
