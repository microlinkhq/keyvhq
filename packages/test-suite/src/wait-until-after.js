'use strict'

const { setTimeout } = require('timers/promises')

const waitUntilAfter = async timestamp => {
  while (Date.now() <= timestamp) await setTimeout(timestamp - Date.now() + 1)
}

module.exports = waitUntilAfter
