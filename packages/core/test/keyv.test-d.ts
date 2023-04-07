/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { expectType } from 'tsd'
import Keyv, { DeserializedData } from '..'

new Keyv({ namespace: 'redis' })
new Keyv({ ttl: 123 })
new Keyv({
  serialize: (d) => {
    expectType<number | null>(d.expires)
    return JSON.stringify(d)
  }
})

new Keyv<boolean>({ deserialize: JSON.parse })

// @ts-expect-error
new Keyv<boolean>({ deserialize: (d: string) => d })

new Keyv<boolean>({
  deserialize: (d) => {
    expectType<string>(d)
    return {
      value: true,
      expires: new Date().getTime()
    }
  }
})

new Keyv<boolean>({ store: new Map() })

new Keyv();

(async () => {
  const keyv = new Keyv<string>()
  expectType<boolean>(await keyv.set('foo', 'expires in 1 second', 1000))
  expectType<boolean>(await keyv.set('foo', 'never expires'))
  expectType<string | undefined>(await keyv.get('foo'))
  expectType<string | undefined>(await keyv.get('foo', { raw: false }))
  expectType<DeserializedData<string> | undefined>(await keyv.get('foo', { raw: true }))
  expectType<boolean>(await keyv.has('foo'))
  expectType<boolean>(await keyv.delete('foo'))
  expectType<void>(await keyv.clear())
  expectType<AsyncIterator<[string, DeserializedData<string>]>>(keyv.iterator())
})()
