/**
 * Extracts all valid nested dot-notation paths of an object type T.
 */
export type Paths<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? | `${K}`
            | (Paths<T[K], Prev[D]> extends infer R
                ? R extends string
                  ? `${K}.${R}`
                  : never
                : never)
          : never;
      }[keyof T]
    : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

/**
 * Resolves the type of the value located at path P in object type T.
 */
export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Safely extracts a value from a nested object using a dot-delimited path.
 */
export function getByPath<T extends Record<string, any>, P extends string>(
  obj: T,
  path: P,
): PathValue<T, P> | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let curr: any = obj;

  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }

  return curr as PathValue<T, P>;
}

/**
 * Safely sets a value at a nested dot-delimited path with prototype pollution guards.
 */
export function setByPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  const parts = path.split('.');
  let curr: any = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      return obj;
    }
    if (!curr[part] || typeof curr[part] !== 'object') {
      curr[part] = {};
    }
    curr = curr[part];
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart !== '__proto__' && lastPart !== 'constructor' && lastPart !== 'prototype') {
    curr[lastPart] = value;
  }

  return obj;
}
