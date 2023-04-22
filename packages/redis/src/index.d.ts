import { Store } from '@keyvhq/core'
import { Redis, RedisOptions } from 'ioredis'

declare class KeyvRedis<TValue> implements Store<TValue> {
  constructor (options?: KeyvRedis.Options)
  constructor (redis: Redis)
  constructor (uri: string, options?: KeyvRedis.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue, ttl?: number): Promise<boolean>
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
