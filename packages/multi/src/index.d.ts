import Keyv, { Store } from '@keyvhq/core'

declare class KeyvMulti<TValue> implements Store<TValue> {
  constructor (options: KeyvMulti.Options<TValue>)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (options?: KeyvMulti.ClearOptions): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvMulti {
  interface Options<TValue> {
    local?: Keyv<TValue>
    remote?: Keyv<TValue>
    validator?: () => boolean
  }
  interface ClearOptions {
    localOnly?: boolean
  }
}

export = KeyvMulti
