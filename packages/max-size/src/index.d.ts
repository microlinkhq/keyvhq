import { Store } from '@keyvhq/core'

interface KeyvMaxSizeSkipContext {
  key: string
  ttl?: number
  value: unknown
  maxSize: number
  valueSize: number
}

interface KeyvMaxSizeOptions {
  maxSize: number
  size?: (value: unknown, key?: string) => number | Promise<number>
  onSkip?: (context: KeyvMaxSizeSkipContext) => void | Promise<void>
}

interface KeyvMaxSizeFactory {
  <TValue>(keyv: Store<TValue>, opts: KeyvMaxSizeOptions): Store<TValue>
  new <TValue>(keyv: Store<TValue>, opts: KeyvMaxSizeOptions): Store<TValue>
  byteLength: (value: unknown) => number
}

declare const KeyvMaxSize: KeyvMaxSizeFactory

export = KeyvMaxSize
