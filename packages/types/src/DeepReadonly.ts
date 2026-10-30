type Builtin =
  Function | Date | Error | RegExp | number | string | boolean | bigint | symbol | null | undefined;

/**
 * Recursively enforces all properties, arrays, sets, and maps to be strictly Readonly,
 * properly preserving primitives, dates, and functions.
 */
export type DeepReadonly<T> = T extends Builtin
  ? T
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
      : T extends Set<infer U>
        ? ReadonlySet<DeepReadonly<U>>
        : T extends ReadonlySet<infer U>
          ? ReadonlySet<DeepReadonly<U>>
          : T extends Array<infer U>
            ? ReadonlyArray<DeepReadonly<U>>
            : T extends readonly (infer U)[]
              ? ReadonlyArray<DeepReadonly<U>>
              : T extends object
                ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
                : T;

export function createDeepReadonly<T>(obj: T): DeepReadonly<T> {
  return (typeof obj === 'object' && obj !== null ? Object.freeze(obj) : obj) as DeepReadonly<T>;
}
