import {expectType, expectError} from 'tsd';
import Keyv, { DeserializedData } from '..';

new Keyv({ namespace: 'redis' });
new Keyv({ ttl: 123 });
new Keyv({
  serialize: (d) => {
    d.value;
    expectType<number | null>(d.expires); // $ExpectType number | null
    return JSON.stringify(d);
  }
});

new Keyv<boolean>({ deserialize: JSON.parse });

// @ts-expect-error
new Keyv<boolean>({ deserialize: (d: string) => d });  

new Keyv<boolean>({
  deserialize: (d) => {
    expectType<string>(d); // $ExpectType string
    return {
      value: true,
      expires: new Date().getTime()
    };
  }
});

new Keyv<boolean>({ store: new Map() });

new Keyv();

(async () => {
  const keyv = new Keyv<string>();

  keyv.on('error', err => console.log('Connection Error', err));

  expectType<boolean>(await keyv.set('foo', 'expires in 1 second', 1000)); // $ExpectType boolean
  expectType<boolean>(await keyv.set('foo', 'never expires')); // $ExpectType true
  expectType<string | undefined>(await keyv.get('foo')); // $ExpectType string | undefined
  expectType<string | undefined>(await keyv.get('foo', { raw: false })); // $ExpectType string | undefined
  expectType<DeserializedData<string> | undefined>(await keyv.get('foo', { raw: true })); // $ExpectType DeserializedData<string> | undefined
  expectType<boolean>(await keyv.has('foo'))
  expectType<boolean>(await keyv.delete('foo')); // $ExpectType boolean
  expectType<void>(await keyv.clear()); // $ExpectType void
  expectType<AsyncIterator<[string, DeserializedData<string>]>>(keyv.iterator())
})()
