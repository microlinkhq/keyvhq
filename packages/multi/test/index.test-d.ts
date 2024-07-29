/* eslint-disable no-new, @typescript-eslint/no-floating-promises */

import Keyv from '@keyvhq/core'
import KeyvMulti from '../src'

const store = new KeyvMulti({
  local: new Keyv(),
  remote: new Keyv()
})

new Keyv({ store }).clear({ localOnly: true })
