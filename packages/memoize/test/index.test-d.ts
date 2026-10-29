/* eslint-disable @typescript-eslint/no-floating-promises */

import { expectAssignable, expectError, expectType } from 'tsd'
import Keyv = require('@keyvhq/core')
import memoize = require('../src')

type HasDefault = 'default' extends keyof typeof memoize ? true : false
expectType<false>(false as HasDefault)

const asyncSum = async (a: number, b: number): Promise<number> => a + b
const syncSum = (a: number, b: number): number => a + b

const memoizedSum = memoize(asyncSum)
expectType<Promise<number>>(memoizedSum(1, 2))
expectType<Keyv<number>>(memoizedSum.keyv)
expectError(memoizedSum('1', 2))

expectType<Promise<number>>(memoize(syncSum)(1, 2))
expectType<Promise<number>>(memoize(asyncSum, undefined, { key: syncSum })(1, 2))
expectType<Promise<number>>(memoize(asyncSum, new Keyv(), { ttl: 100 })(1, 2))
expectType<Promise<number>>(
  memoize(asyncSum, { namespace: 'sum' }, { staleTtl: 10, ttl: sum => sum })(1, 2)
)

memoize(asyncSum, undefined, {
  key: (a, b) => {
    expectType<number>(a)
    expectType<number>(b)
    return [a, b > 1]
  }
})

const memoizedString = memoize(asyncSum, undefined, {
  value: sum => {
    expectType<number>(sum)
    return String(sum)
  },
  ttl: value => {
    expectType<string>(value)
    return 1000
  }
})
expectType<Promise<string>>(memoizedString(1, 2))

const [value, info] = await memoize(asyncSum, new Keyv(), { objectMode: true })(1, 2)
expectType<number>(value)
expectType<boolean>(info.isStale)
expectAssignable<memoize.Info>(info)

expectAssignable<memoize.Options<number>>({ ttl: 1000, objectMode: false })

declare const objectMode: boolean
expectType<Promise<number | [number, memoize.Info]>>(
  memoize(asyncSum, undefined, { objectMode })(1, 2)
)

const fetchUrl = async (url: string, opts?: { retry: number }): Promise<number> => url.length + (opts?.retry ?? 0)
expectType<Promise<number>>(memoize(fetchUrl, undefined, { key: url => url })('x', { retry: 1 }))

expectError(memoize(asyncSum, undefined, { staleTtl: true }))
expectType<Promise<number>>(memoize(asyncSum, undefined, { ttl: sum => sum > 0 ? 1000 : undefined })(1, 2))
