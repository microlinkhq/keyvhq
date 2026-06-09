import Keyv from '@keyvhq/core'

declare function KeyvCompress<TValue = any> (
  keyv: Keyv<TValue>,
  opts?: KeyvCompress.Options
): Keyv<TValue>

declare namespace KeyvCompress {
  interface Options {
    enable?: boolean
    serialize?: (source: any) => any
    deserialize?: (source: any) => any
    compressOptions?: Record<string, any>
    decompressOptions?: Record<string, any>
  }
}

export = KeyvCompress
