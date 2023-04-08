import { Store } from '@keyvhq/core'

declare class KeyvMulti<TValue> implements Store<TValue> {
  constructor (options: KeyvMulti.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (options?: KeyvMulti.ClearOptions): Promise<void>
  iterator (): AsyncGenerator
}

declare namespace KeyvMulti {
  interface Options {
    local?: Map<string, any>
    remote?: Map<string, any>
    validator?: () => boolean
  }
  interface ClearOptions {
    localOnly?: boolean
  }
}

export = KeyvMulti
