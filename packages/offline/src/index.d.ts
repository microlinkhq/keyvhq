import { Store } from '@keyvhq/core'

declare function KeyvOffline<TValue> (
  keyv: Store<TValue>
): Store<TValue>

declare namespace KeyvOffline {
  // No additional options for this adapter
}

export = KeyvOffline
