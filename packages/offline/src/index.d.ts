import { Store } from '@keyvhq/core'

declare class KeyvOffline<TValue> {
  constructor (keyv: Store<TValue>)
}

declare namespace KeyvOffline {
  // No additional options for this adapter
}

export = KeyvOffline
