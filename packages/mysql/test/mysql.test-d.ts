/* eslint-disable no-new */

import Keyv from '@keyvhq/core'
import KeyvMysql from '..'

new Keyv({ store: new KeyvMysql({ uri: 'mysql://user:pass@localhost:3306/dbname', table: 'cache' }) })

new KeyvMysql({ uri: 'mysql://user:pass@localhost:3306/dbname' })
new KeyvMysql({ table: 'cache' })
new KeyvMysql({ keySize: 100 })

const mysql = new KeyvMysql({ uri: 'mysql://user:pass@localhost:3306/dbname' })
new Keyv({ store: mysql })
