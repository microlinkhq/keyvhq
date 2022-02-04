/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-invalid-void-type */

import Keyv = require('@keyvhq/core')
import KeyvSqlite = require('..')

new Keyv({ store: new KeyvSqlite({ uri: 'sqlite://path/to/database.sqlite', table: 'cache' }) })

new KeyvSqlite({ uri: 'sqlite://path/to/database.sqlite' })
new KeyvSqlite({ busyTimeout: 10000 })
new KeyvSqlite({ table: 'cache' })
new KeyvSqlite({ keySize: 100 })

const sqlite = new KeyvSqlite({ uri: 'sqlite://path/to/database.sqlite' })
new Keyv({ store: sqlite })
