import { Store } from '@keyvhq/core'
import { Redis, RedisOptions } from 'ioredis'

declare class KeyvRedis implements Store<string | undefined> {
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
