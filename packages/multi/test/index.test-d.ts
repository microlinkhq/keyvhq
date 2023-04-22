/* eslint-disable no-new, @typescript-eslint/no-floating-promises */

import Keyv from '@keyvhq/core'
import KeyvMulti from '../src'

const store = new KeyvMulti({
  local: new Map(),
  remote: new Map()
})

new Keyv({ store }).clear({ localOnly: true })
