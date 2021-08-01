# @keyvhq/memoize [<img width="100" align="right" src="https://ghcdn.rawgit.org/microlinkhq/keyv/master/media/logo-sunset.svg" alt="keyv">](https://github.com/microlinkhq/keyv)

> Memoize any function using Keyv as storage backend.

## Install

```shell
npm install --save keyv @keyvhq/memoize
```

## Usage

```js
const memoize = require('@keyvhq/memoize');

const memoizedRequest = memoize(request);

memoizedRequest('http://example.com').then(resp => { /* from request */ });
memoizedRequest('http://example.com').then(resp => { /* from cache */ });
```

You can pass a [keyv](https://github.com/microlinkhq/keyv) instance or options to be used as argument.

```js
memoize(request, { store: new Map() });
memoize(request, 'redis://user:pass@localhost:6379');
memoize(request, new Keyv());
```

### Resolver

By default the first argument of your function call is used as cache key. 

You can use a resolver if you want to change the key. The resolver is called with the same arguments as the function.

```js
const sum = (n1, n2) => n1 + n2;

const memoized = memoize(sum, new Keyv(), {
  resolver: (n1, n2) => `${n1}+${n2}`
});

// cached as { '1+2': 3 }
memoized(1, 2); 
```

The library uses flood protection internally based on the result of this resolver. This means you can make as many requests as you want simultaneously while being sure you won't flood your async resource.

### TTL

Set `ttl` to a `number` for a static TTL value.

```js
const memoizedRequest = memoize(request, new Keyv(), { ttl: 60000 });

// cached for 60 seconds
memoizedRequest('http://example.com');
```

Set `ttl` to a `function` for a dynamic TTL value.

```js
const memoizedRequest = memoize(request, new Keyv(), {
  ttl: (res) => res.statusCode === 200 ? 60000 : 0
});

// cached for 60 seconds only if response was 200 OK
memoizedRequest('http://example.com'); 
```

### Stale

Set `stale` to any `number` of milliseconds.

If the `ttl` of a requested resource is below this staleness threshold we will still return the stale value but meanwhile asynchronously refresh the value.

```js
const memoizedRequest = memoize(request, new Keyv(), { 
  ttl: 60000,
  stale: 10000
});

// cached for 60 seconds
memoizedRequest('http://example.com'); 

// … 55 seconds later
// Our cache will expire in 5 seconds.
// This is below the staleness threshold of 10 seconds.
// returns cached result + refresh cache on background
memoizedRequest('http://example.com'); 
```

When the `stale` option is set we won't delete expired items either. The same logic as above applies.

## API

### memoize(fn, \[keyvOptions], \[options])

#### fn

Type: `Function`<br>
*Required*

Promise-returning or async function to be memoized.

#### keyvOptions

Type: `Object`

The [Keyv]https://github.com/microlinkhq/keyv] instance or [keyv#options](https://github.com/microlinkhq/keyv#options) to be used.

#### options

##### resolver

Type: `Function`<br/>
Default: `identity`

##### ttl

Type: `Number` or `Function`<br/>
Default: `undefined`

The time-to-live quantity of time the value will considered as fresh.

##### stale

Type: `Number`<br/>
Default: `undefined`

The staleness threshold we will still return the stale value but meanwhile asynchronously refresh the value.

## License

**@keyvhq/memoize** © [Microlink](https://microlink.io), Released under the [MIT](https://github.com/microlinkhq/keyv/blob/master/LICENSE.md) License.<br/>
Authored and maintained by [Microlink](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv/contributors).

> [microlink.io](https://microlink.io) · GitHub [@MicrolinkHQ](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
