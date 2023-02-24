/* eslint-disable no-new */

import Keyv from '@keyvhq/core'
import KeyvPostgres from '..'

new Keyv({ store: new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname', table: 'cache' }) })

new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname' })
new KeyvPostgres({ table: 'cache' })
new KeyvPostgres({ keySize: 100 })

const postgres = new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname' })
new Keyv({ store: postgres })
