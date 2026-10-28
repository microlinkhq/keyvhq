'use strict'

const MAX_TIMER_DELAY = 2 ** 31 - 1

const calcPercent = (partial, total) =>
  `${total === 0 ? 0 : Math.round((partial / total) * 100)}%`

function KeyvStats (
  keyv,
  {
    interval = 15000,
    key = '__keyv_stats__',
    initialData = { hit: 0, miss: 0 }
  } = {}
) {
  if (!(this instanceof KeyvStats)) return new KeyvStats(keyv, { interval })

  const get = keyv.get.bind(keyv)

  const buffer = get(key).then(stats =>
    stats === undefined ? initialData : stats
  )

  const save = async () => keyv.set(key, await buffer)

  // Node rewrites a delay below 1ms, or above 2**31-1 ms, to 1ms.
  if (interval >= 1) setInterval(save, Math.min(interval, MAX_TIMER_DELAY)).unref()

  keyv.get = async (...args) => {
    const result = await get(...args)
    ++(await buffer)[result === undefined ? 'miss' : 'hit']
    return result
  }

  keyv.stats = {}

  keyv.stats.reset = () => keyv.set(key, initialData)

  keyv.stats.info = async () => {
    const { hit, miss } = await buffer
    const total = hit + miss
    return {
      hit: {
        value: hit,
        percent: calcPercent(hit, total)
      },
      miss: {
        value: miss,
        percent: calcPercent(miss, total)
      },
      total
    }
  }

  keyv.stats.save = save

  return keyv
}

module.exports = KeyvStats
