import { clean, CleanOptions } from './index';

/**
 * Flattens a deeply nested object into a single-level object with delimited path keys,
 * while automatically purifying null and undefined values.
 */
export function flattenClean(
  obj: Record<string, any>,
  delimiter = '.',
  options?: CleanOptions,
): Record<string, any> {
  const cleaned = clean(obj, options);
  if (!cleaned || typeof cleaned !== 'object') return {};

  const result: Record<string, any> = {};

  function recurse(curr: any, prefix = ''): void {
    if (curr === null || curr === undefined) return;

    if (
      typeof curr !== 'object' ||
      curr instanceof Date ||
      curr instanceof RegExp ||
      curr instanceof Error
    ) {
      if (prefix) result[prefix] = curr;
      return;
    }

    if (Array.isArray(curr)) {
      curr.forEach((item, index) => {
        const path = prefix ? `${prefix}${delimiter}${index}` : `${index}`;
        recurse(item, path);
      });
      return;
    }

    const keys = Object.keys(curr);
    for (const key of keys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const path = prefix ? `${prefix}${delimiter}${key}` : key;
      recurse(curr[key], path);
    }
  }

  recurse(cleaned, '');
  return result;
}

/**
 * Unflattens a single-level delimited object back into a deeply nested structure,
 * safely preventing prototype pollution attacks.
 */
export function unflattenClean(
  obj: Record<string, any>,
  delimiter = '.',
  options?: CleanOptions,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const parts = key.split(delimiter);
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        continue;
      }
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart !== '__proto__' && lastPart !== 'constructor' && lastPart !== 'prototype') {
      current[lastPart] = value;
    }
  }

  return clean(result, options) || {};
}
