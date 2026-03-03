import { Store } from '@keyvhq/core'

declare class KeyvCompress<TValue> {
  constructor (keyv: Store<TValue>, opts?: KeyvCompress.Options)
}

declare namespace KeyvCompress {
  interface Options {
    serialize?: (data: { value: unknown; expires: number | null }) => string
    deserialize?: (data: string) => { value: unknown; expires: number | null }
    compress?: (value: unknown) => Promise<unknown>
    decompress?: (value: unknown) => Promise<unknown>
  }
}

export = KeyvCompress
