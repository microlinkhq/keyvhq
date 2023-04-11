'use strict'

const INITIAL = { hit: 0, miss: 0 }

const calcPercent = (partial, total) =>
  `${total === 0 ? 0 : Math.round((partial / total) * 100)}%`

function KeyvStats (
  keyv,
  { interval = 15000, key = '__internal_stats__' } = {}
) {
  if (!(this instanceof KeyvStats)) return new KeyvStats(keyv, { interval })

  const get = keyv.get.bind(keyv)

  const getStats = () =>
    get(key).then(stats => (stats === undefined ? INITIAL : stats))

  let buffer = getStats()
  const getBuffer = () => Promise.resolve(buffer)
  const setBuffer = newBuffer => (buffer = newBuffer)
  const save = async () => keyv.set(key, await getBuffer())

  if (interval > 0) setInterval(save).unref()

  keyv.get = async (...args) => {
    const result = await get(...args)
    const buffer = await getBuffer()
    ++buffer[result === undefined ? 'miss' : 'hit']
    setBuffer(buffer)
    return result
  }

  keyv.stats = {}

  keyv.stats.reset = () => keyv.set(key, INITIAL)

  keyv.stats.info = async () => {
    const buffer = await getBuffer()
    const total = buffer.hit + buffer.miss
    return {
      hit: {
        value: buffer.hit,
        percent: calcPercent(buffer.hit, total)
      },
      miss: {
        value: buffer.miss,
        percent: calcPercent(buffer.miss, total)
      },
      total
    }
  }

  keyv.stats.save = save

  return keyv
}

module.exports = KeyvStats
