import Keyv = require('@keyvhq/core')

declare namespace memoize {
  interface Options<
    RawResult,
    Result = RawResult,
    Args extends any[] = any[],
    ObjectMode extends boolean = false
  > {
    key?: (...args: Args & {}) => any
    objectMode?: ObjectMode
    staleTtl?: number | ((value: Result) => number | boolean)
    ttl?: number | ((value: Result) => number | undefined)
    value?: (value: RawResult) => Result | Promise<Result>
  }

  interface Info {
    hasValue: boolean
    key: any
    isExpired: boolean
    isStale: boolean
    forceExpiration?: unknown
    staleError?: unknown
  }

  interface Memoized<Result, Args extends any[], Output> {
    (...args: Args): Promise<Output>
    keyv: Keyv<Result>
    ttl: (value: Result) => number | undefined
    staleTtl: ((value: Result) => number | boolean) | undefined
  }
}

declare function memoize<
  RawResult,
  Result = RawResult,
  Args extends any[] = any[],
  ObjectMode extends boolean = false
> (
  fn: (...args: Args) => RawResult | Promise<RawResult>,
  keyvOptions?: Keyv | Keyv.Options<any>,
  options?: memoize.Options<RawResult, Result, Args, ObjectMode>
): memoize.Memoized<
Result,
Args,
ObjectMode extends true ? [Result, memoize.Info] : Result
>

export = memoize
