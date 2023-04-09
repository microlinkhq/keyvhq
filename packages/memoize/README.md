# @keyvhq/memoize [<img width="100" align="right" src="https://keyvhq.js.org/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv/packages/memoize)

> Memoize any function using Keyv as storage backend.

## Install

```shell
npm install --save @keyvhq/memoize
```

## Usage

```js
const memoize = require('@keyvhq/memoize')

const memoizedRequest = memoize(request)

memoizedRequest('http://example.com').then(res => { /* from request */ })
memoizedRequest('http://example.com').then(res => { /* from cache */ })
```

You can pass a [keyv](https://github.com/microlinkhq/keyv) instance or options to be used as argument:

```js
const memoize = require('@keyvhq/memoize')
const Keyv = require('@keyvhq/core')

memoize(request, { store: new Keyv({ namespace: 'ssr' }) })
```

### Defining the key

By default the first argument of your function call is used as cache key. 

You can pass a function to define how key will be defined. The key function will be called with the same arguments as the function.

```js
const sum = (n1, n2) => n1 + n2

const memoized = memoize(sum, new Keyv(), {
  key: (n1, n2) => `${n1}+${n2}`
})

// cached as { '1+2': 3 }
memoized(1, 2)
```

The library uses flood protection internally based on the result of the key. 

This means you can make as many requests as you want simultaneously while being sure you won't flood your async resource.

### Setup your TTL

Set `ttl` to a `number` for a static TTL value.

```js
const memoizedRequest = memoize(request, new Keyv(), { ttl: 60000 })

// cached for 60 seconds
memoizedRequest('http://example.com')
```

Set `ttl` to a `function` for a dynamic TTL value.

```js
const memoizedRequest = memoize(request, new Keyv(), {
  ttl: (res) => res.statusCode === 200 ? 60000 : 0
})

// cached for 60 seconds only if response was 200 OK
memoizedRequest('http://example.com')
```

### Stale support

Set `staleTtl` to any `number` of milliseconds.

If the `ttl` of a requested resource is below this staleness threshold we will still return the stale value but meanwhile asynchronously refresh the value.

```js
const memoizedRequest = memoize(request, new Keyv(), {
  ttl: 60000,
  staleTtl: 10000
})

// cached for 60 seconds
memoizedRequest('http://example.com')

// … 55 seconds later
// Our cache will expire in 5 seconds.
// This is below the staleness threshold of 10 seconds.
// returns cached result + refresh cache on background
memoizedRequest('http://example.com')
```

When the `staleTtl` option is set we won't delete expired items either. The same logic as above applies.

## API

### memoize(fn, \[keyvOptions], \[options])

#### fn

Type: `Function`<br>
*Required*

Promise-returning or async function to be memoized.

#### keyvOptions

Type: `Object`

The [Keyv](https://github.com/microlinkhq/keyv) instance or [keyv#options](https://github.com/microlinkhq/keyv#options) to be used.

#### options

##### key

Type: `Function`<br/>
Default: `identity`

It defines how the get will be obtained.

The signature of the function should be a `String` to be used as key associated with the cache copy:

```js
key: ({ req }) => req.url
```

Just in case you need a more granular control, you can return an `Array`, where the second value determines the expiration behavior:

```js
key: ({ req }) => [req.url, req.query.forceExpiration]
```

##### objectMode

Type: `Boolean`<br/>
Default: `false`

When is `true`, the result will be an `Array`, being the second item in the `Array` some information about the item:

```js
const fn = () => Promise.reject(new Error('NOPE'))
const keyv = new Keyv()
const memoizedSum = memoize(fn, keyv, { staleTtl: 10, objectMode: true })

const [sum, info] = await memoizedSum(1, 2)

console.log(info)
// {
//   hasValue: true,
//   key: 1,
//   isExpired: false,
//   isStale: true,
//   staleError: Error: NOPE
// }
```

##### staleTtl

Type: `Number` or `Function`<br/>
Default: `undefined`

The staleness threshold we will still return the stale value but meanwhile asynchronously refresh the value.

When you provide a function, the value will be passed as first argument.

##### ttl

Type: `Number` or `Function`<br/>
Default: `undefined`

The time-to-live quantity of time the value will considered as fresh.

##### value

Type: `Function`<br/>
Default: `identity`

A decorate function to be applied before store the value.

## License

**@keyvhq/memoize** © [Dieter Luypaert](https://moeriki.com), released under the [MIT](https://github.com/microlinkhq/keyvhq/blob/master/LICENSE.md) License.<br/>
Maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyvhq/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
