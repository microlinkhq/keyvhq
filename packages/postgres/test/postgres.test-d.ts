/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-invalid-void-type */

import Keyv = require('@keyvhq/core')
import KeyvPostgres = require('..')

new Keyv({ store: new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname', table: 'cache' }) })

new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname' })
new KeyvPostgres({ table: 'cache' })
new KeyvPostgres({ keySize: 100 })

const postgres = new KeyvPostgres({ uri: 'postgres://user:pass@localhost:5432/dbname' })
new Keyv({ store: postgres })
