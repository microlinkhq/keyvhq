import { Store } from '@keyvhq/core'

declare class KeyvFile<TValue> implements Store<TValue> {
  constructor (uri: string)
  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue, ttl?: number): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (): Promise<void>
  iterator (): AsyncGenerator
}

export = KeyvFile
