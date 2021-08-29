'use strict'

const compressBrotli = require('compress-brotli')

function KeyvCompress (keyv, opts) {
  if (!(this instanceof KeyvCompress)) return new KeyvCompress(keyv, opts)

  const brotli = compressBrotli(opts)

  keyv.serialize = async ({ value, expires }) => {
    return brotli.serialize({ value: await brotli.compress(value), expires })
  }

  keyv.deserialize = async data => {
    const { value, expires } = brotli.deserialize(data)
    return { value: await brotli.decompress(value), expires }
  }

  return keyv
}

module.exports = KeyvCompress
