'use strict'

const keyvTestSuite = require('@keyvhq/test-suite')
const Keyv = require('@keyvhq/core')
const test = require('ava')

const KeyvCFKV = require('..')

const {
  CLOUDFLARE_KEY: key,
  CLOUDFLARE_EMAIL: email,
  CLOUDFLARE_ACCOUNT_ID: accountId,
  CLOUDFLARE_NAMESPACE_ID: namespaceId
} = process.env

const store = () => new KeyvCFKV({ key, email, accountId, namespaceId })

keyvTestSuite(test, Keyv, store)
