// Type definitions for @keyv/redis 1.3
// Project: https://github.com/lukechilds/keyv-redis
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

import { Store } from '@keyvhq/core'
import { Redis, RedisOptions } from 'ioredis'
import { EventEmitter } from 'events'

declare class KeyvRedis extends EventEmitter implements Store<string | undefined> {
  readonly ttlSupport: true
  namespace?: string | undefined

  constructor (options?: KeyvRedis.Options)
  constructor (redis: Redis)
  constructor (uri: string, options?: KeyvRedis.Options)

  get (key: string): Promise<string | undefined>
  has (key: string): Promise<boolean>
  set (key: string, value: string | undefined, ttl?: number): Promise<number>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvRedis {
  interface Options extends RedisOptions {
    uri?: string | undefined
    emitErrors?: boolean | true
  }
}

export = KeyvRedis
