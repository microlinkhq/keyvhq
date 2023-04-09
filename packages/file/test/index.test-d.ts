/* eslint-disable no-new */

import Keyv from '@keyvhq/core'
import KeyvFile from '../src'

new Keyv({ store: new KeyvFile('./test.json') })
