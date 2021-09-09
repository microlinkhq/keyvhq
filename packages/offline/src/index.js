'use strict'

const debug = require('debug-logfmt')('keyv-offline')
const { serializeError } = require('serialize-error')

function KeyvOffline (keyv) {
  if (!(this instanceof KeyvOffline)) return new KeyvOffline(keyv)

  return new Proxy(keyv, {
    get: (keyv, method) => {
      switch (method) {
        case 'get':
          return async (...args) => {
            try {
              const result = await keyv.get(...args)
              return result
            } catch (error) {
              debug('get', serializeError(error))
              return undefined
            }
          }
        case 'set':
          return async (...args) => {
            try {
              const result = await keyv.set(...args)
              return result
            } catch (error) {
              debug('set', serializeError(error))
              return false
            }
          }
        default:
          return Reflect.get(keyv, method)
      }
    }
  })
}

module.exports = KeyvOffline
