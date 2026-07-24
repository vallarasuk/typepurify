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

  const keys = Array.isArray(path) ? path : path.split(/[.[\]'"]/).filter(Boolean);

  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue as T;
    result = result[key];
  }

  return result !== undefined ? result : (defaultValue as T);
}
