export type DeepRequired<T> = T extends Builtin
  ? T
  : T extends Map<infer K, infer V>
    ? Map<DeepRequired<K>, DeepRequired<V>>
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
      : T extends WeakMap<infer K, infer V>
        ? WeakMap<DeepRequired<K>, DeepRequired<V>>
        : T extends Set<infer U>
          ? Set<DeepRequired<U>>
          : T extends ReadonlySet<infer U>
            ? ReadonlySet<DeepRequired<U>>
            : T extends WeakSet<infer U>
              ? WeakSet<DeepRequired<U>>
              : T extends Array<infer U>
                ? Array<DeepRequired<U>>
                : T extends Promise<infer U>
                  ? Promise<DeepRequired<U>>
                  : T extends {}
                    ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
                    : NonNullable<T>;

type Builtin = Function | Date | Error | RegExp;

export interface CleanOptions {
  stripEmptyStrings?: boolean;
  stripEmptyArrays?: boolean;
  stripEmptyObjects?: boolean;
}

/**
 * Recursively deep-cleans null/undefined values from objects and arrays,
 * dynamically re-inferring compile-time types without schemas.
 */
export function clean<T>(
  obj: T,
  options: CleanOptions = {},
  seen = new WeakSet(),
): DeepRequired<T> {
  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    if (obj === '' && options.stripEmptyStrings) return undefined as any;
    return obj as any;
  }

  if (seen.has(obj as any)) return obj as any;
  seen.add(obj as any);

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => clean(item, options, seen))
      .filter((item) => item !== undefined);

    if (cleanedArray.length === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return cleanedArray as any;
  }

  const cleanedObj: Record<string, any> = {};
  let hasKeys = false;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val === null || val === undefined) continue;
      if (val === '' && options.stripEmptyStrings) continue;

      const cleanedVal = clean(val, options, seen);

      if (cleanedVal !== undefined) {
        cleanedObj[key] = cleanedVal;
        hasKeys = true;
      }
    }
  }

  if (!hasKeys && options.stripEmptyObjects) {
    return undefined as any;
  }

  return cleanedObj as any;
}
