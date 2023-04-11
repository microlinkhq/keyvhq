import { Store } from '@keyvhq/core'

declare class KeyvStats<TValue> implements Store<TValue> {
  constructor (keyv: Map<TValue>, options: KeyvStats.Options)

  get (key: string): Promise<TValue>
  has (key: string): Promise<boolean>
  set (key: string, value: TValue): Promise<boolean>
  delete (key: string): Promise<boolean>
  clear (options?: KeyvStats.ClearOptions): Promise<void>
  iterator (): AsyncGenerator
  stats: {
    reset: Promise<void>
    info: Promise<Stats>
    save: Promise<void>
  }
}

declare namespace KeyvStats {
  interface Options {
    interval?: number
  }

  interface Stats {
    hit: {
      value: number
      percent: string
    }
    miss: {
      value: number
      percent: string
    }
    total: number
  }
}

export = KeyvStats
