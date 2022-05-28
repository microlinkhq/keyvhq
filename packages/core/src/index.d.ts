// Type definitions for keyv 3.1
// Project: https://github.com/lukechilds/keyv
// Definitions by: AryloYeung <https://github.com/Arylo>
//                 BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.8

import { EventEmitter } from 'events'

declare class Keyv<TValue = any> extends EventEmitter {
  constructor (opts?: Keyv.Options<TValue>);

  /** Returns the value. */
  get<TRaw extends boolean = false>(key: string, options?: { raw?: TRaw }):
  Promise<(TRaw extends false
    ? TValue
    : Keyv.DeserializedData<TValue>) | undefined>;
  /** Returns `true` if the key existed, `false` if not. */
  has (key: string): Promise<boolean>
  /**
     * Set a value.
     *
     * By default keys are persistent. You can set an expiry TTL in milliseconds.
     */
  set (key: string, value: TValue, ttl?: number): Promise<boolean>;
  /**
     * Deletes an entry.
     *
     * Returns `true` if the key existed, `false` if not.
     */
  delete (key: string): Promise<boolean>;
  /** Delete all entries in the current namespace. */
  clear (): Promise<void>;
  /**
     * Yields an iterator with all the key, value entries in the namespace.
     */
  iterator (): AsyncIterator<[string, Keyv.DeserializedData<string>]>;
}

declare namespace Keyv {
  interface Options<TValue> {
    /** Namespace for the current instance. */
    namespace?: string | undefined
    /** A custom serialization function. */
    serialize?: ((data: DeserializedData<TValue>) => string | Promise<string>) | undefined
    /** A custom deserialization function. */
    deserialize?: ((data: string) => DeserializedData<TValue> | undefined | Promise<DeserializedData<TValue> | undefined>) | undefined
    /** The storage adapter instance to be used by Keyv. Defaults to in-memory map */
    store?: Store<TValue> | Map<string, string>
    /** Default TTL. Can be overridden by specififying a TTL on `.set()`. */
    ttl?: number | undefined
    /** Emit Errors on the keyv instance, defaults to true. */
    emitErrors?: boolean | true
  }

  interface DeserializedData<TValue> {
    value: TValue
    expires: number | null
  }

  interface Store<TValue> {
    get: (key: string) => TValue | Promise<TValue | undefined> | undefined
    has: (key: string) => Promise<boolean>
    set: (key: string, value: TValue, ttl?: number) => any
    delete: (key: string) => boolean | Promise<boolean>
    clear: () => void | Promise<void>
    iterator: () => AsyncGenerator
  }
}

export = Keyv
