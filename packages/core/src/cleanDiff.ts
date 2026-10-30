import { clean, CleanOptions, DeepRequired } from './index';

export interface CleanDiffResult {
  strippedPaths: string[];
  strippedCount: number;
  preservedCount: number;
}

export interface CleanDiffOutput<T, O extends CleanOptions = {}> {
  cleaned: DeepRequired<T, O>;
  diff: CleanDiffResult;
}

/**
 * Recursively deep-cleans null, undefined, and empty values while computing
 * an exact structural diff of all removed/stripped property paths.
 */
export function cleanDiff<T, const O extends CleanOptions = {}>(
  obj: T,
  options: O = {} as O,
): CleanDiffOutput<T, O> {
  const strippedPaths: string[] = [];
  let preservedCount = 0;

  function walk(current: any, path: string): void {
    if (current === null || current === undefined) {
      strippedPaths.push(path || '<root>');
      return;
    }

    if (options.stripFalsy && !current) {
      strippedPaths.push(path || '<root>');
      return;
    }

    if (options.stripWhen && options.stripWhen(current)) {
      strippedPaths.push(path || '<root>');
      return;
    }

    if (typeof current !== 'object') {
      if (typeof current === 'string') {
        const val = options.trimStrings ? current.trim() : current;
        if (val === '' && (options.stripEmptyStrings || options.stripAllEmpty)) {
          strippedPaths.push(path || '<root>');
          return;
        }
      }
      if (typeof current === 'number') {
        if (Number.isNaN(current) && options.stripNaN) {
          strippedPaths.push(path || '<root>');
          return;
        }
        if (!Number.isFinite(current) && options.stripInfinity) {
          strippedPaths.push(path || '<root>');
          return;
        }
      }
      preservedCount++;
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0 && (options.stripEmptyArrays || options.stripAllEmpty)) {
        strippedPaths.push(path || '<root>');
        return;
      }
      for (let i = 0; i < current.length; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`;
        walk(current[i], itemPath);
      }
      return;
    }

    if (
      current instanceof Date ||
      current instanceof RegExp ||
      current instanceof Error ||
      (typeof URL !== 'undefined' && current instanceof URL)
    ) {
      preservedCount++;
      return;
    }

    const keys = Object.keys(current);
    if (keys.length === 0 && (options.stripEmptyObjects || options.stripAllEmpty)) {
      strippedPaths.push(path || '<root>');
      return;
    }

    for (const key of keys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const keyPath = path ? `${path}.${key}` : key;
      walk(current[key], keyPath);
    }
  }

  walk(obj, '');

  const cleaned = clean(obj, options);
  return {
    cleaned,
    diff: {
      strippedPaths,
      strippedCount: strippedPaths.length,
      preservedCount,
    },
  };
}
