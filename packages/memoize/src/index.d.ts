export = memoize;
declare function memoize(fn: any, keyvOptions: any, { key: getKey, objectMode, staleTtl: rawStaleTtl, ttl: rawTtl, value: getValue }?: {
    key?: (value: any) => any;
    objectMode?: boolean;
    staleTtl: any;
    ttl: any;
    value?: (value: any) => any;
}): any;
