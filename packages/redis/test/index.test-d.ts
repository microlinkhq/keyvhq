/* eslint-disable no-new */

import Keyv from '@keyvhq/core'
import KeyvRedis from '../src'

new Keyv({
  store: new KeyvRedis({
    uri: 'redis://user:pass@localhost:6379',
    db: 1
  })
})

new KeyvRedis({ uri: 'redis://user:pass@localhost:6379' })
new KeyvRedis('redis://user:pass@localhost:6379', {
  db: 1
})
new KeyvRedis('redis://user:pass@localhost:6379', {
  uri: 'redis://user:pass@localhost:6379',
  db: 1
})
const redis = new KeyvRedis('redis://user:pass@localhost:6379')
new Keyv({ store: redis })
