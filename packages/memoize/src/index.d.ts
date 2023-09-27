import { Options, Store } from '@keyvhq/core'

declare function memoize<RawResult, Result, Args extends any[]> (
  fn: (...args: Args) => Promise<RawResult>,
  keyvOptions: Options | Store,
  options: {
    key?: (value: RawResult) => any
    objectMode?: boolean
    staleTtl?: number | boolean | ((value: any) => number | boolean)
    ttl?: number | ((value: any) => number)
    // Difficult to type this one, so we'll just leave it as any
    // When options.value is not provided, the return type of the memoized function is Result
    // I can't figure out how to type this, so I'm just going to leave it as any
    value?: (value: RawResult) => Result
  }
): (...args: Args) => Promise<RawResult>

export default memoize
