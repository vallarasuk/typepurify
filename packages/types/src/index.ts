/**
 * DeepMerge recursively merges two types, T and U.
 * If both are objects, it merges their properties deeply.
 */
export type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof U
          ? K extends keyof T
            ? DeepMerge<T[K], U[K]>
            : U[K]
          : K extends keyof T
            ? T[K]
            : never;
      }
    : U
  : U;

/**
 * DeepReadonly recursively makes all properties of T readonly.
 */
export type DeepReadonly<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * Maps a primitive value to its TypeScript type string representation.
 * Simplified JSON to TS generator logic.
 */
export function jsonToTsType(json: any): string {
  if (json === null) return 'null';
  if (Array.isArray(json)) {
    if (json.length === 0) return 'any[]';
    return `${jsonToTsType(json[0])}[]`;
  }
  if (typeof json === 'object') {
    const props = Object.entries(json)
      .map(([k, v]) => `${k}: ${jsonToTsType(v)};`)
      .join(' ');
    return `{ ${props} }`;
  }
  return typeof json;
}

/**
 * Safe Object Path extractor.
 * Gets the value at path of object safely.
 */
export function get<T = any>(obj: any, path: string | string[], defaultValue?: T): T {
  if (!obj) return defaultValue as T;

  if (typeof path === 'string' && path in obj) {
    return obj[path];
  }

  // Advanced path parsing (handles 'a[b].c' and 'a["b"]' correctly)
  const keys = Array.isArray(path)
    ? path
    : path
        .replace(/\[(["']?)(.*?)\1\]/g, '.$2') // Convert [key] or ['key'] to .key
        .split('.')
        .filter(Boolean);

  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue as T;
    result = result[key];
  }

  return result !== undefined ? result : (defaultValue as T);
}

export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? _DeepPartialArray<U>
    : T extends object
      ? _DeepPartialObject<T>
      : T | undefined;
interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}
type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepOmit<T, K> = T extends object
  ? { [P in keyof T as Exclude<P, K>]: DeepOmit<T[P], K> }
  : T;

// New Types
export type Merge<T, U> = Omit<T, keyof U> & U;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsNever<T> = [T] extends [never] ? true : false;
export type TupleToObject<T extends readonly any[]> = {
  [K in T[number]]: K;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Transforms template literal strings into strict utility types.
 */
export type TransformTemplate<T extends string> = T extends `${infer Start}_${infer End}`
  ? `${Start}-${End}`
  : T;

/**
 * Converts a snake_case string type into camelCase.
 */
export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;
