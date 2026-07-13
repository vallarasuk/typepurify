export type DeepRequired<T, O extends CleanOptions = {}> = T extends Builtin
  ? T
  : T extends Map<infer K, infer V>
    ? Map<DeepRequired<K, O>, DeepRequired<V, O>>
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<DeepRequired<K, O>, DeepRequired<V, O>>
      : T extends WeakMap<infer K, infer V>
        ? WeakMap<DeepRequired<K, O>, DeepRequired<V, O>>
        : T extends Set<infer U>
          ? Set<DeepRequired<U, O>>
          : T extends ReadonlySet<infer U>
            ? ReadonlySet<DeepRequired<U, O>>
            : T extends WeakSet<infer U>
              ? WeakSet<DeepRequired<U, O>>
              : T extends Array<infer U>
                ? Array<DeepRequired<U, O>>
                : T extends Promise<infer U>
                  ? Promise<DeepRequired<U, O>>
                  : T extends {}
                    ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>, O> }
                    : ApplyStrictOptions<NonNullable<T>, O>;

type ApplyStrictOptions<T, O extends CleanOptions> = O['stripEmptyStrings'] extends true
  ? Exclude<T, ''>
  : T;

type Builtin = Function | Date | Error | RegExp;

/**
 * Configuration options for the typepurify cleaning engine.
 */
export interface CleanOptions {
  /** Removes all empty strings `""` from the payload. */
  stripEmptyStrings?: boolean;
  /** Removes all empty arrays `[]` from the payload. */
  stripEmptyArrays?: boolean;
  /** Removes all empty objects `{}` from the payload. */
  stripEmptyObjects?: boolean;
  /** Trims whitespace from strings before processing them. */
  trimStrings?: boolean;
  /** Custom predicate function. If it returns true, the value is stripped. */
  stripWhen?: (value: any) => boolean;
  /** Custom transform callback function to mutate or format values before cleaning. */
  transform?: (value: any, key?: any) => any;
}

/**
 * Recursively deep-cleans null and undefined values from objects and arrays.
 * Dynamically re-infers compile-time types without requiring manual schemas.
 *
 * @param obj The payload to clean.
 * @param options Configuration for stripping empty values.
 * @param seen (Internal) WeakSet to track circular references.
 * @returns A brand new object with null/undefined values removed, heavily typed via `DeepRequired`.
 *
 * @example
 * const payload = { id: 1, name: null };
 * const safe = clean(payload); // { id: 1 }
 */
export function clean<T, const O extends CleanOptions = {}>(
  obj: T,
  options: O = {} as O,
  seen = new WeakSet(),
  key?: any,
): DeepRequired<T, O> {
  if (options.transform) {
    obj = options.transform(obj, key);
  }

  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if (options.stripWhen && options.stripWhen(obj)) {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const val = options.trimStrings ? obj.trim() : obj;
      if (val === '' && options.stripEmptyStrings) return undefined as any;
      return val as any;
    }
    return obj as any;
  }

  if (seen.has(obj as any)) return obj as any;
  seen.add(obj as any);

  if (Array.isArray(obj)) {
    const cleanedArray = [];
    for (let i = 0; i < obj.length; i++) {
      const cleanedItem = clean(obj[i], options, seen, i);
      if (cleanedItem !== undefined) {
        cleanedArray.push(cleanedItem);
      }
    }

    if (cleanedArray.length === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return cleanedArray as any;
  }

  if (obj instanceof Map) {
    const cleanedMap = new Map();
    for (const [k, v] of obj.entries()) {
      const cleanedKey = clean(k, options, seen);
      const cleanedValue = clean(v, options, seen, k);
      if (cleanedKey !== undefined && cleanedValue !== undefined) {
        cleanedMap.set(cleanedKey, cleanedValue);
      }
    }
    if (cleanedMap.size === 0 && options.stripEmptyObjects) {
      return undefined as any;
    }
    return cleanedMap as any;
  }

  if (obj instanceof Set) {
    const cleanedSet = new Set();
    for (const v of obj.values()) {
      const cleanedValue = clean(v, options, seen);
      if (cleanedValue !== undefined) {
        cleanedSet.add(cleanedValue);
      }
    }
    if (cleanedSet.size === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return cleanedSet as any;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Error ||
    typeof obj === 'function'
  ) {
    return obj as any;
  }

  const proto = Object.getPrototypeOf(obj);
  const cleanedObj: Record<string, any> =
    proto === null ? Object.create(null) : Object.create(proto);
  let hasKeys = false;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const cleanedVal = clean(val, options, seen, key);

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

/**
 * Recursively deep-cleans null and undefined values by mutating the original object directly.
 * Offers extreme performance and zero memory overhead for massive payloads.
 *
 * WARNING: Mutates the provided object. Use `clean()` if you need an immutable operation.
 *
 * @param obj The payload to mutate and clean.
 * @param options Configuration for stripping empty values.
 * @param seen (Internal) WeakSet to track circular references.
 * @returns The exact same object reference passed in, but cleaned.
 */
export function cleanInPlace<T, const O extends CleanOptions = {}>(
  obj: T,
  options: O = {} as O,
  seen = new WeakSet(),
  key?: any,
): DeepRequired<T, O> {
  if (options.transform) {
    const transformed = options.transform(obj, key);
    // If the transform changed the reference, we use the new reference.
    // Mutability can't apply strictly to primitives, but we update the local reference.
    obj = transformed;
  }

  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if (options.stripWhen && options.stripWhen(obj)) {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const val = options.trimStrings ? obj.trim() : obj;
      if (val === '' && options.stripEmptyStrings) return undefined as any;
      return val as any;
    }
    return obj as any;
  }

  if (seen.has(obj as any)) return obj as any;
  seen.add(obj as any);

  if (Array.isArray(obj)) {
    let writeIndex = 0;
    for (let i = 0; i < obj.length; i++) {
      const cleanedItem = cleanInPlace(obj[i], options, seen, i);
      if (cleanedItem !== undefined) {
        obj[writeIndex++] = cleanedItem;
      }
    }
    obj.length = writeIndex;

    if (obj.length === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return obj as any;
  }

  if (obj instanceof Map) {
    for (const [k, v] of Array.from(obj.entries())) {
      const cleanedKey = cleanInPlace(k, options, seen);
      const cleanedValue = cleanInPlace(v, options, seen, k);

      // If the key or value was removed, or if the key was transformed to a new key
      if (cleanedKey === undefined || cleanedValue === undefined) {
        obj.delete(k);
      } else {
        if (cleanedKey !== k) {
          obj.delete(k);
          obj.set(cleanedKey, cleanedValue);
        } else {
          obj.set(k, cleanedValue);
        }
      }
    }
    if (obj.size === 0 && options.stripEmptyObjects) {
      return undefined as any;
    }
    return obj as any;
  }

  if (obj instanceof Set) {
    for (const v of Array.from(obj.values())) {
      const cleanedValue = cleanInPlace(v, options, seen);

      if (cleanedValue === undefined) {
        obj.delete(v);
      } else if (cleanedValue !== v) {
        obj.delete(v);
        obj.add(cleanedValue);
      }
    }
    if (obj.size === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return obj as any;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Error ||
    typeof obj === 'function'
  ) {
    return obj as any;
  }

  let hasKeys = false;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const cleanedVal = cleanInPlace(val, options, seen, key);

      if (cleanedVal === undefined) {
        delete (obj as any)[key];
      } else {
        (obj as any)[key] = cleanedVal;
        hasKeys = true;
      }
    }
  }

  if (!hasKeys && options.stripEmptyObjects) {
    return undefined as any;
  }

  return obj as any;
}

// Helper to yield the event loop
const yieldLoop = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Asynchronously deep-cleans null and undefined values from objects and arrays.
 * Yields to the event loop every 1000 iterations to prevent blocking on massive payloads.
 *
 * @param obj The payload to clean.
 * @param options Configuration for stripping empty values.
 * @param seen (Internal) WeakSet to track circular references.
 * @param key (Internal) The current object key.
 * @param state (Internal) Iteration counter.
 * @returns A promise that resolves to a brand new object with null/undefined values removed.
 */
export async function cleanAsync<T, const O extends CleanOptions = {}>(
  obj: T,
  options: O = {} as O,
  seen = new WeakSet(),
  key?: any,
  state: { count: number } = { count: 0 },
): Promise<DeepRequired<T, O>> {
  if (++state.count % 1000 === 0) {
    await yieldLoop();
  }

  if (options.transform) {
    obj = options.transform(obj, key);
  }

  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if (options.stripWhen && options.stripWhen(obj)) {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const val = options.trimStrings ? obj.trim() : obj;
      if (val === '' && options.stripEmptyStrings) return undefined as any;
      return val as any;
    }
    return obj as any;
  }

  if (seen.has(obj as any)) return obj as any;
  seen.add(obj as any);

  if (Array.isArray(obj)) {
    const cleanedArray = [];
    for (let i = 0; i < obj.length; i++) {
      const cleanedItem = await cleanAsync(obj[i], options, seen, i, state);
      if (cleanedItem !== undefined) {
        cleanedArray.push(cleanedItem);
      }
    }

    if (cleanedArray.length === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return cleanedArray as any;
  }

  if (obj instanceof Map) {
    const cleanedMap = new Map();
    for (const [k, v] of obj.entries()) {
      const cleanedKey = await cleanAsync(k, options, seen, undefined, state);
      const cleanedValue = await cleanAsync(v, options, seen, k, state);
      if (cleanedKey !== undefined && cleanedValue !== undefined) {
        cleanedMap.set(cleanedKey, cleanedValue);
      }
    }
    if (cleanedMap.size === 0 && options.stripEmptyObjects) {
      return undefined as any;
    }
    return cleanedMap as any;
  }

  if (obj instanceof Set) {
    const cleanedSet = new Set();
    for (const v of obj.values()) {
      const cleanedValue = await cleanAsync(v, options, seen, undefined, state);
      if (cleanedValue !== undefined) {
        cleanedSet.add(cleanedValue);
      }
    }
    if (cleanedSet.size === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return cleanedSet as any;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Error ||
    typeof obj === 'function'
  ) {
    return obj as any;
  }

  const proto = Object.getPrototypeOf(obj);
  const cleanedObj: Record<string, any> =
    proto === null ? Object.create(null) : Object.create(proto);
  let hasKeys = false;

  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const val = obj[k];
      const cleanedVal = await cleanAsync(val, options, seen, k, state);

      if (cleanedVal !== undefined) {
        cleanedObj[k] = cleanedVal;
        hasKeys = true;
      }
    }
  }

  if (!hasKeys && options.stripEmptyObjects) {
    return undefined as any;
  }

  return cleanedObj as any;
}

/**
 * Asynchronously deep-cleans null and undefined values by mutating the original object directly.
 * Yields to the event loop every 1000 iterations to prevent blocking on massive payloads.
 *
 * @param obj The payload to mutate and clean.
 * @param options Configuration for stripping empty values.
 * @param seen (Internal) WeakSet to track circular references.
 * @param key (Internal) The current object key.
 * @param state (Internal) Iteration counter.
 * @returns A promise that resolves to the exact same object reference passed in, but cleaned.
 */
export async function cleanInPlaceAsync<T, const O extends CleanOptions = {}>(
  obj: T,
  options: O = {} as O,
  seen = new WeakSet(),
  key?: any,
  state: { count: number } = { count: 0 },
): Promise<DeepRequired<T, O>> {
  if (++state.count % 1000 === 0) {
    await yieldLoop();
  }

  if (options.transform) {
    const transformed = options.transform(obj, key);
    obj = transformed;
  }

  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if (options.stripWhen && options.stripWhen(obj)) {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const val = options.trimStrings ? obj.trim() : obj;
      if (val === '' && options.stripEmptyStrings) return undefined as any;
      return val as any;
    }
    return obj as any;
  }

  if (seen.has(obj as any)) return obj as any;
  seen.add(obj as any);

  if (Array.isArray(obj)) {
    let writeIndex = 0;
    for (let i = 0; i < obj.length; i++) {
      const cleanedItem = await cleanInPlaceAsync(obj[i], options, seen, i, state);
      if (cleanedItem !== undefined) {
        obj[writeIndex++] = cleanedItem;
      }
    }
    obj.length = writeIndex;

    if (obj.length === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return obj as any;
  }

  if (obj instanceof Map) {
    for (const [k, v] of Array.from(obj.entries())) {
      const cleanedKey = await cleanInPlaceAsync(k, options, seen, undefined, state);
      const cleanedValue = await cleanInPlaceAsync(v, options, seen, k, state);

      if (cleanedKey === undefined || cleanedValue === undefined) {
        obj.delete(k);
      } else {
        if (cleanedKey !== k) {
          obj.delete(k);
          obj.set(cleanedKey, cleanedValue);
        } else {
          obj.set(k, cleanedValue);
        }
      }
    }
    if (obj.size === 0 && options.stripEmptyObjects) {
      return undefined as any;
    }
    return obj as any;
  }

  if (obj instanceof Set) {
    for (const v of Array.from(obj.values())) {
      const cleanedValue = await cleanInPlaceAsync(v, options, seen, undefined, state);

      if (cleanedValue === undefined) {
        obj.delete(v);
      } else if (cleanedValue !== v) {
        obj.delete(v);
        obj.add(cleanedValue);
      }
    }
    if (obj.size === 0 && options.stripEmptyArrays) {
      return undefined as any;
    }
    return obj as any;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Error ||
    typeof obj === 'function'
  ) {
    return obj as any;
  }

  let hasKeys = false;

  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const val = obj[k];
      const cleanedVal = await cleanInPlaceAsync(val, options, seen, k, state);

      if (cleanedVal === undefined) {
        delete (obj as any)[k];
      } else {
        (obj as any)[k] = cleanedVal;
        hasKeys = true;
      }
    }
  }

  if (!hasKeys && options.stripEmptyObjects) {
    return undefined as any;
  }

  return obj as any;
}
