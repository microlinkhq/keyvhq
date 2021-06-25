const keyvIteratorTests = (test, Keyv, store) => {
  test.beforeEach(async () => {
    const keyv = new Keyv({ store: store() })
    await keyv.clear()
  })

  test.serial('.iterator() returns an asyncIterator', t => {
    const keyv = new Keyv({ store: store() })
    t.true(typeof keyv.iterator()[Symbol.asyncIterator] === 'function')
  })

  test.serial('iterator() iterates over all values', async t => {
    const keyv = new Keyv({ store: store() })
    const map = new Map(Array.from({ length: 5 }).fill(0).map((x, i) => [String(i), String(i + 10)]))
    const toResolve = []
    for (const [key, value] of map) {
      toResolve.push(keyv.set(key, value))
    }

    await Promise.all(toResolve)
    t.plan(map.size)
    for await (const [key, value] of keyv.iterator()) {
      const doesKeyExist = map.has(key)
      const isValueSame = map.get(key) === value
      t.true(doesKeyExist && isValueSame)
    }
  })
}

module.exports = keyvIteratorTests
