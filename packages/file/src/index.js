'use strict'

const { mkdirSync, readFileSync, writeFileSync } = require('fs')
const { dirname } = require('path')

const read = path => {
  try {
    return Object.entries(JSON.parse(readFileSync(path, 'utf8')))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return undefined
  }
}

const write = async map => {
  try {
    return writeFileSync(map.uri, JSON.stringify(Object.fromEntries(map)))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await mkdirSync(dirname(map.uri), { recursive: true })
    return write(map)
  }
}

class KeyvFile extends Map {
  constructor (uri) {
    if (!uri) throw new TypeError('A file uri should be provided.')
    super(read(uri))
    this.uri = uri
  }

  set = (...args) => {
    const result = super.set(...args)
    write(this)
    return result
  }

  clear = (...args) => {
    super.clear(...args)
    write(this)
  }
}

module.exports = KeyvFile
