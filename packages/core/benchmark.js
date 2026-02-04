'use strict'

const JSONB = require('json-buffer')

// ============================================================================
// OLD IMPLEMENTATION (with performance issues)
// ============================================================================
class KeyvOld {
  constructor (options = {}) {
    Object.entries(
      Object.assign(
        {
          serialize: JSONB.stringify,
          deserialize: JSONB.parse,
          store: new Map()
        },
        options
      )
    ).forEach(([key, value]) => (this[key] = value))

    const generateIterator = iterator =>
      async function * () {
        for await (const [key, raw] of typeof iterator === 'function'
          ? iterator(this.namespace)
          : iterator) {
          const data =
            typeof raw === 'string' ? await this.deserialize(raw) : raw
          if (this.namespace && !key.includes(this.namespace)) {
            continue
          }

          if (typeof data.expires === 'number' && Date.now() > data.expires) {
            this.delete(key)
            continue
          }

          yield [this._getKeyUnprefix(key), data.value]
        }
      }

    if (
      typeof this.store[Symbol.iterator] === 'function' &&
      this.store instanceof Map
    ) {
      this.iterator = generateIterator(this.store)
    } else if (typeof this.store.iterator === 'function') {
      this.iterator = generateIterator(this.store.iterator.bind(this.store))
    }
  }

  _getKeyPrefix (key) {
    return this.namespace
      ? `${this.namespace}:${key}`
      : (key && key.toString()) || key
  }

  _getKeyUnprefix (key) {
    return this.namespace ? key.split(':').splice(1).join(':') : key
  }

  async get (key, { raw: asRaw = false } = {}) {
    const raw = await this.store.get(this._getKeyPrefix(key))
    if (raw === undefined) return undefined

    const data = typeof raw === 'string' ? await this.deserialize(raw) : raw

    if (typeof data.expires === 'number' && Date.now() > data.expires) {
      this.delete(key)
      return undefined
    }

    return asRaw ? data : data.value
  }

  async has (key) {
    return typeof this.store.has === 'function'
      ? this.store.has(this._getKeyPrefix(key))
      : (await this.store.get(this._getKeyPrefix(key))) !== undefined
  }

  async set (key, value, ttl) {
    if (value === undefined) return false
    if (ttl === undefined) ttl = this.ttl
    if (ttl === 0) ttl = undefined
    const expires = typeof ttl === 'number' ? Date.now() + ttl : null
    const valueSerialized = await this.serialize({ value, expires })
    await this.store.set(this._getKeyPrefix(key), valueSerialized, ttl)
    return true
  }

  async delete (key) {
    return this.store.delete(this._getKeyPrefix(key))
  }

  async clear (options) {
    return this.store.clear(this.namespace, options)
  }
}

// ============================================================================
// NEW IMPLEMENTATION (optimized)
// ============================================================================
class KeyvNew {
  constructor (options = {}) {
    const defaults = {
      serialize: JSONB.stringify,
      deserialize: JSONB.parse,
      store: new Map()
    }
    const config = { ...defaults, ...options }
    Object.assign(this, config)

    const generateIterator = iterator =>
      async function * () {
        const now = Date.now()
        const nsPrefix = this.namespace ? `${this.namespace}:` : null
        for await (const [key, raw] of typeof iterator === 'function'
          ? iterator(this.namespace)
          : iterator) {
          const data =
            typeof raw === 'string' ? await this.deserialize(raw) : raw
          if (nsPrefix && !key.startsWith(nsPrefix)) {
            continue
          }

          if (typeof data.expires === 'number' && now > data.expires) {
            this.delete(key)
            continue
          }

          yield [this._getKeyUnprefix(key), data.value]
        }
      }

    if (
      typeof this.store[Symbol.iterator] === 'function' &&
      this.store instanceof Map
    ) {
      this.iterator = generateIterator(this.store)
    } else if (typeof this.store.iterator === 'function') {
      this.iterator = generateIterator(this.store.iterator.bind(this.store))
    }
  }

  _getKeyPrefix (key) {
    return this.namespace
      ? `${this.namespace}:${key}`
      : (key && key.toString()) || key
  }

  _getKeyUnprefix (key) {
    if (!this.namespace) return key
    const index = key.indexOf(':')
    return index === -1 ? key : key.substring(index + 1)
  }

  async get (key, { raw: asRaw = false } = {}) {
    const raw = await this.store.get(this._getKeyPrefix(key))
    if (raw === undefined) return undefined

    const data = typeof raw === 'string' ? await this.deserialize(raw) : raw

    if (typeof data.expires === 'number' && Date.now() > data.expires) {
      this.delete(key)
      return undefined
    }

    return asRaw ? data : data.value
  }

  async has (key) {
    return typeof this.store.has === 'function'
      ? this.store.has(this._getKeyPrefix(key))
      : (await this.store.get(this._getKeyPrefix(key))) !== undefined
  }

  async set (key, value, ttl) {
    if (value === undefined) return false
    if (ttl === undefined) ttl = this.ttl
    if (ttl === 0) ttl = undefined
    const expires = typeof ttl === 'number' ? Date.now() + ttl : null
    const valueSerialized = await this.serialize({ value, expires })
    await this.store.set(this._getKeyPrefix(key), valueSerialized, ttl)
    return true
  }

  async delete (key) {
    return this.store.delete(this._getKeyPrefix(key))
  }

  async clear (options) {
    return this.store.clear(this.namespace, options)
  }
}

// ============================================================================
// BENCHMARK TESTS
// ============================================================================
async function benchmark (name, fn, iterations = 10000) {
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) {
    await fn()
  }
  const end = process.hrtime.bigint()
  const duration = Number(end - start) / 1e6 // Convert to ms
  const opsPerSecond = (iterations / duration) * 1000
  return { name, duration: duration.toFixed(2), opsPerSecond: opsPerSecond.toFixed(0) }
}

async function benchmarkIterator (name, keyv, keysCount = 1000) {
  const start = process.hrtime.bigint()
  let count = 0
  for await (const _ of keyv.iterator()) {
    count++
  }
  const end = process.hrtime.bigint()
  const duration = Number(end - start) / 1e6
  return { name, keysCount, count, duration: duration.toFixed(2), timePerKey: (duration / count).toFixed(4) }
}

async function benchmarkGetKeyUnprefix (name, keyv, iterations = 100000) {
  const testKey = 'namespace:key123:with:colons'
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) {
    keyv._getKeyUnprefix(testKey)
  }
  const end = process.hrtime.bigint()
  const duration = Number(end - start) / 1e6
  const opsPerSecond = (iterations / duration) * 1000
  return { name, iterations, duration: duration.toFixed(2), opsPerSecond: opsPerSecond.toFixed(0) }
}

async function runBenchmarks () {
  console.log('\n' + '='.repeat(80))
  console.log('  KEYV PERFORMANCE BENCHMARK')
  console.log('='.repeat(80) + '\n')

  // Test 1: Set operations
  console.log('📊 TEST 1: SET OPERATIONS (10,000 iterations)')
  console.log('-'.repeat(80))
  const keyvOldSet = new KeyvOld()
  const keyvNewSet = new KeyvNew()
  
  const setOldResult = await benchmark('Old Implementation (set)', () => keyvOldSet.set(`key${Math.random()}`, 'value'), 10000)
  const setNewResult = await benchmark('New Implementation (set)', () => keyvNewSet.set(`key${Math.random()}`, 'value'), 10000)
  
  console.log(`${setOldResult.name}: ${setOldResult.duration}ms (${setOldResult.opsPerSecond} ops/sec)`)
  console.log(`${setNewResult.name}: ${setNewResult.duration}ms (${setNewResult.opsPerSecond} ops/sec)`)
  console.log()

  // Test 2: Get operations
  console.log('📊 TEST 2: GET OPERATIONS (10,000 iterations)')
  console.log('-'.repeat(80))
  const keyvOldGet = new KeyvOld()
  const keyvNewGet = new KeyvNew()
  
  await keyvOldGet.set('testkey', 'testvalue')
  await keyvNewGet.set('testkey', 'testvalue')
  
  const getOldResult = await benchmark('Old Implementation (get)', () => keyvOldGet.get('testkey'), 10000)
  const getNewResult = await benchmark('New Implementation (get)', () => keyvNewGet.get('testkey'), 10000)
  
  console.log(`${getOldResult.name}: ${getOldResult.duration}ms (${getOldResult.opsPerSecond} ops/sec)`)
  console.log(`${getNewResult.name}: ${getNewResult.duration}ms (${getNewResult.opsPerSecond} ops/sec)`)
  console.log()

  // Test 3: _getKeyUnprefix (string operation)
  console.log('📊 TEST 3: _getKeyUnprefix() PERFORMANCE (100,000 iterations)')
  console.log('-'.repeat(80))
  const keyvOldUnprefix = new KeyvOld({ namespace: 'test' })
  const keyvNewUnprefix = new KeyvNew({ namespace: 'test' })
  
  const unprefixOldResult = await benchmarkGetKeyUnprefix('Old (split+splice+join)', keyvOldUnprefix, 100000)
  const unprefixNewResult = await benchmarkGetKeyUnprefix('New (indexOf+substring)', keyvNewUnprefix, 100000)
  
  console.log(`${unprefixOldResult.name}:  ${unprefixOldResult.duration}ms (${unprefixOldResult.opsPerSecond} ops/sec)`)
  console.log(`${unprefixNewResult.name}: ${unprefixNewResult.duration}ms (${unprefixNewResult.opsPerSecond} ops/sec)`)
  const unprefixImprovement = ((parseFloat(unprefixOldResult.duration) - parseFloat(unprefixNewResult.duration)) / parseFloat(unprefixOldResult.duration) * 100).toFixed(1)
  console.log(`⚡ Improvement: ${unprefixImprovement}%`)
  console.log()

  // Test 4: Iterator with namespace
  console.log('📊 TEST 4: ITERATOR WITH NAMESPACE (1,000 keys)')
  console.log('-'.repeat(80))
  const keyvOldIter = new KeyvOld({ namespace: 'iter' })
  const keyvNewIter = new KeyvNew({ namespace: 'iter' })
  
  for (let i = 0; i < 1000; i++) {
    await keyvOldIter.set(`key${i}`, `value${i}`)
    await keyvNewIter.set(`key${i}`, `value${i}`)
  }
  
  const iterOldResult = await benchmarkIterator('Old Implementation', keyvOldIter, 1000)
  const iterNewResult = await benchmarkIterator('New Implementation', keyvNewIter, 1000)
  
  console.log(`${iterOldResult.name}: ${iterOldResult.duration}ms (${iterOldResult.timePerKey}ms/key)`)
  console.log(`${iterNewResult.name}: ${iterNewResult.duration}ms (${iterNewResult.timePerKey}ms/key)`)
  const iterImprovement = ((parseFloat(iterOldResult.duration) - parseFloat(iterNewResult.duration)) / parseFloat(iterOldResult.duration) * 100).toFixed(1)
  console.log(`⚡ Improvement: ${iterImprovement}%`)
  console.log()

  // Test 5: Constructor performance
  console.log('📊 TEST 5: CONSTRUCTOR PERFORMANCE (10,000 instances)')
  console.log('-'.repeat(80))
  const constructOldResult = await benchmark('Old Implementation', () => new KeyvOld(), 10000)
  const constructNewResult = await benchmark('New Implementation', () => new KeyvNew(), 10000)
  
  console.log(`${constructOldResult.name}: ${constructOldResult.duration}ms (${constructOldResult.opsPerSecond} ops/sec)`)
  console.log(`${constructNewResult.name}: ${constructNewResult.duration}ms (${constructNewResult.opsPerSecond} ops/sec)`)
  const constructImprovement = ((parseFloat(constructOldResult.duration) - parseFloat(constructNewResult.duration)) / parseFloat(constructOldResult.duration) * 100).toFixed(1)
  console.log(`⚡ Improvement: ${constructImprovement}%`)
  console.log()

  console.log('='.repeat(80))
  console.log('✅ BENCHMARK COMPLETE')
  console.log('='.repeat(80) + '\n')
}

runBenchmarks().catch(console.error)
