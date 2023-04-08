import { Store } from '@keyvhq/core'
import { MongoClientOptions } from 'mongodb'

declare class KeyvMongo<TValue> implements Store<TValue> {
  constructor (uri?: string)
  constructor (options?: KeyvMongo.Options)
  constructor (uri: string, options?: KeyvMongo.Options)

  get (key: string): Promise<TValue | undefined>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue, ttl?: number): Promise<any>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvMongo {
  interface Options extends MongoClientOptions {
    uri?: string | undefined
    collection?: string | undefined
  }
}

export = KeyvMongo
