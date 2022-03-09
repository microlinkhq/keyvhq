// Type definitions for @keyv/mysql 1.1
// Project: https://github.com/lukechilds/keyv-mysql
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

import { Store } from '@keyvhq/core'
import { EventEmitter } from 'events'

declare class KeyvMysql extends EventEmitter implements Store<string | undefined> {
  readonly ttlSupport: false
  namespace?: string | undefined

  constructor (uri?: string);
  constructor (options?: KeyvMysql.Options);
  constructor (uri: string, options?: KeyvMysql.Options);

  get (key: string): Promise<string | undefined>;
  has (key: string): Promise<boolean>;
  set (key: string, value: string | undefined): Promise<any>;
  delete (key: string): Promise<boolean>;
  clear (): Promise<void>;
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
