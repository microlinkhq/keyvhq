'use strict'

const { deepStrictEqual } = require('node:assert')
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

const Keyv = require('../packages/core/src')
const memoize = require('../packages/memoize/src')

const RUNS = 7
const SET_GET_OPS = 50_000
const GET_BUFFER_OPS = 100_000
const NAMESPACE_OPS = 50_000
const MEMOIZE_HIT_OPS = 200_000
const DEDUPE_ROUNDS = 5_000
const DEDUPE_CONCURRENCY = 100
const STALE_OPS = 50_000
const KEY_SPACE = 1_000
const HOUR = 60 * 60 * 1000

const OBJECT = {
  id: 42,
  url: 'https://example.com/article',
  title: 'A typical cached payload',
  tags: ['cache', 'keyv', 'ttl'],
  nested: { status: 200, ok: true }
}

const BUFFER = Buffer.from('keyvhq benchmark buffer payload '.repeat(32))

const KEYS = Array.from({ length: KEY_SPACE }, (_, index) => `key-${index}`)

const setGet = keyv => async () => {
  let last
  for (let i = 0; i < SET_GET_OPS; i++) {
    const key = KEYS[i % KEY_SPACE]
    await keyv.set(key, OBJECT)
    last = await keyv.get(key)
  }
  deepStrictEqual(last, OBJECT)
}

const getBuffer = () => {
  const keyv = new Keyv()
  const ready = keyv.set('buffer', BUFFER)
  return async () => {
    await ready
    let last
    for (let i = 0; i < GET_BUFFER_OPS; i++) last = await keyv.get('buffer')
    if (!Buffer.isBuffer(last) || !last.equals(BUFFER)) {
      throw new Error('buffer did not round-trip')
    }
  }
}

const memoizeHit = () => {
  let calls = 0
  const memoized = memoize(async key => {
    calls++
    return { key }
  }, new Keyv())
  return async () => {
    let last
    for (let i = 0; i < MEMOIZE_HIT_OPS; i++) last = await memoized('hit')
    if (last.key !== 'hit' || calls !== 1) {
      throw new Error(`memoize hit called fn ${calls} times`)
    }
  }
}

const memoizeDedupe = async () => {
  let calls = 0
  const memoized = memoize(async key => {
    calls++
    return key
  }, new Keyv())
  const batch = new Array(DEDUPE_CONCURRENCY)
  for (let round = 0; round < DEDUPE_ROUNDS; round++) {
    const key = KEYS[round % KEY_SPACE] + `-${round}`
    for (let i = 0; i < DEDUPE_CONCURRENCY; i++) batch[i] = memoized(key)
    const values = await Promise.all(batch)
    if (values[DEDUPE_CONCURRENCY - 1] !== key) throw new Error('bad dedupe value')
  }
  if (calls !== DEDUPE_ROUNDS) {
    throw new Error(`dedupe called fn ${calls} times, expected ${DEDUPE_ROUNDS}`)
  }
}

const memoizeStale = () => {
  let calls = 0
  const memoized = memoize(
    async () => {
      calls++
      return 'fresh'
    },
    new Keyv(),
    { ttl: HOUR, staleTtl: 2 * HOUR }
  )
  const ready = Promise.all(KEYS.map(key => memoized.keyv.set(key, 'fresh', HOUR)))
  return async () => {
    await ready
    const before = calls
    let last
    for (let i = 0; i < STALE_OPS; i++) last = await memoized(KEYS[i % KEY_SPACE])
    await new Promise(resolve => setImmediate(resolve))
    const revalidations = calls - before
    if (last !== 'fresh' || revalidations !== STALE_OPS) {
      throw new Error(`stale path revalidated ${revalidations} of ${STALE_OPS} calls`)
    }
  }
}

const CASES = [
  {
    name: 'core set+get object',
    work: `${SET_GET_OPS} set+get`,
    run: setGet(new Keyv())
  },
  {
    name: 'core get buffer',
    work: `${GET_BUFFER_OPS} get of ${BUFFER.length} bytes`,
    run: getBuffer()
  },
  {
    name: 'core namespace set+get object',
    work: `${NAMESPACE_OPS} set+get`,
    run: setGet(new Keyv({ namespace: 'bench' }))
  },
  {
    name: 'memoize hit',
    work: `${MEMOIZE_HIT_OPS} calls`,
    run: memoizeHit()
  },
  {
    name: 'memoize concurrent dedupe',
    work: `${DEDUPE_ROUNDS} rounds x ${DEDUPE_CONCURRENCY} concurrent calls`,
    run: memoizeDedupe
  },
  {
    name: 'memoize stale',
    work: `${STALE_OPS} calls, each serving stale and revalidating`,
    run: memoizeStale()
  }
]

const median = values => {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const sample = async entry => {
  const walls = []
  let errors = 0
  for (let run = 0; run < RUNS; run++) {
    const started = process.hrtime.bigint()
    try {
      await entry.run()
      walls.push(Number(process.hrtime.bigint() - started) / 1e6)
    } catch (error) {
      errors++
      console.error(`${entry.name} run ${run}`, error)
    }
  }
  return walls.length
    ? { med: median(walls), min: Math.min(...walls), max: Math.max(...walls), errors }
    : { med: Number.NaN, min: Number.NaN, max: Number.NaN, errors }
}

const report = (entry, result) => {
  const min = result.min.toFixed(1)
  const max = result.max.toFixed(1)
  const extra = `work ${entry.work}, errors ${result.errors}, runs ${RUNS}`
  console.log(`${entry.name}  median ${result.med.toFixed(1)}ms  range ${min}-${max}  ${extra}`)
  return {
    name: entry.name,
    unit: 'ms',
    value: Number(result.med.toFixed(1)),
    range: `${min}-${max}`,
    extra
  }
}

const main = async () => {
  const results = []
  let errors = 0
  for (const entry of CASES) {
    try {
      await entry.run()
    } catch (error) {
      errors++
      console.error(`${entry.name} warmup`, error)
    }
    const result = await sample(entry)
    errors += result.errors
    results.push(report(entry, result))
  }
  writeFileSync(
    join(__dirname, '..', 'benchmark-output.json'),
    JSON.stringify(results, null, 2) + '\n'
  )
  if (errors > 0 || results.some(result => !Number.isFinite(result.value))) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
