/**
 * Deep JSON Diff Engine.
 * Returns an object representing the differences between two objects.
 */
export function deepDiff(obj1: any, obj2: any): any {
  if (obj1 === obj2) return undefined;

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return { old: obj1, new: obj2 };
  }

  if (Array.isArray(obj1) || Array.isArray(obj2)) {
    // Array diffing is complex, simplified version:
    return { old: obj1, new: obj2 };
  }

  const diff: any = {};
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of keys) {
    if (!(key in obj1)) {
      diff[key] = { added: obj2[key] };
    } else if (!(key in obj2)) {
      diff[key] = { removed: obj1[key] };
    } else {
      const nestedDiff = deepDiff(obj1[key], obj2[key]);
      if (nestedDiff !== undefined) {
        diff[key] = nestedDiff;
      }
    }
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

/**
 * Basic JSON Repair.
 * Tries to fix common JSON errors (missing quotes, trailing commas).
 */
export function repairJson(str: string): string {
  let repaired = str;
  // Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"');
  // Fix missing quotes around keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  // Remove trailing commas
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  return repaired;
}

/**
 * Removes circular references from an object to allow JSON.stringify to succeed.
 */
export function removeCircular(obj: any, options?: { sortKeys?: boolean }): any {
  const seen = new WeakSet();

  function clone(val: any): any {
    if (typeof val !== 'object' || val === null) {
      return val;
    }

    if (seen.has(val)) {
      return '[Circular]';
    }
    seen.add(val);

    if (Array.isArray(val)) {
      return val.map(clone);
    }

    const res: any = {};
    const keys = options?.sortKeys ? Object.keys(val).sort() : Object.keys(val);
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = clone(val[key]);
      }
    }
    return res;
  }

  return clone(obj);
}

/**
 * Compares two objects, ignoring specified keys.
 */
export function compareIgnoreKeys(
  obj1: any,
  obj2: any,
  ignoreKeys: string[] | Set<string> = [],
): boolean {
  const diff = deepDiff(obj1, obj2);

  if (!diff) return true;

  const ignoreSet = ignoreKeys instanceof Set ? ignoreKeys : new Set(ignoreKeys);

  // Check if all diffs are in ignoreKeys
  function checkDiff(d: any, path: string): boolean {
    if (ignoreSet.has(path)) return true;

    // If it's a leaf node diff
    if (
      d.old !== undefined ||
      d.new !== undefined ||
      d.added !== undefined ||
      d.removed !== undefined
    ) {
      return false;
    }

    // Iterate nested
    for (const key in d) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!checkDiff(d[key], currentPath)) {
        return false;
      }
    }

    return true;
  }

  return checkDiff(diff, '');
}

/**
 * Resilient JSON parser that falls back to a default value instead of throwing.
 */
export function safeParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * A wrapper around JSON.parse that returns an object containing the parsed data or the error.
 * Eliminates the need for try/catch blocks.
 */
export function safeJsonParse<T = any>(str: string): { data: T | null; error: Error | null } {
  try {
    return { data: JSON.parse(str), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Deep merges multiple JSON-serializable objects.
 * Arrays are overwritten by default unless custom logic is provided.
 */
export function deepMerge<T extends object = any>(target: T, ...sources: Record<string, any>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (target === undefined || target === null) {
    return deepMerge(source as any, ...sources);
  }

  if (typeof target === 'object' && typeof source === 'object' && source !== null) {
    const t = target as Record<string, any>;
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          if (!t[key]) Object.assign(t, { [key]: {} });
          deepMerge(t[key] as any, source[key] as any);
        } else {
          Object.assign(t, { [key]: source[key] });
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Estimates the byte size of an object if it were to be JSON stringified.
 */
export function jsonSize(obj: any): number {
  if (obj === undefined) return 0;

  // Fast path for simple primitives
  if (typeof obj === 'string') return obj.length + 2; // includes quotes
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj).length;
  if (obj === null) return 4;

  // Slower accurate path for objects/arrays
  return Buffer.byteLength(JSON.stringify(obj) || '', 'utf8');
}

/**
 * Flatten CSV to JSON converter stream.
 */
export function flattenCsvToJson(csv: string): object[] {
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  };

  const lines = csv.split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

/**
 * Converts a JSON object or map into clean XML representation.
 */
export function jsonToXml(obj: Record<string, any>, rootTag = 'root'): string {
  function toXml(val: any, tag: string): string {
    if (val === null || val === undefined) {
      return `<${tag}/>`;
    }
    if (typeof val !== 'object') {
      return `<${tag}>${String(val)}</${tag}>`;
    }
    if (Array.isArray(val)) {
      return val.map((item) => toXml(item, tag)).join('');
    }
    const children = Object.keys(val)
      .map((key) => toXml(val[key], key))
      .join('');
    return `<${tag}>${children}</${tag}>`;
  }

  return toXml(obj, rootTag);
}

/**
 * Safely stringifies a JSON object, automatically detecting and removing circular references.
 * Never throws an error.
 */
export function safeJsonStringify(obj: any, space: number | string = 2): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch (err) {
    if (err instanceof Error && err.message.includes('circular')) {
      return JSON.stringify(removeCircular(obj), null, space);
    }
    return '{}';
  }
}

/**
 * Validates whether a string is a valid JSON string.
 */
export function isJsonString(str: string): boolean {
  if (typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts a value from a JSON object using simple dot notation path string.
 */
export function jsonPathSelector<T = any>(obj: any, path: string, fallback?: T): T {
  if (!obj || !path) return fallback as T;
  const parts = path.split('.').filter(Boolean);
  let curr = obj;
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return fallback as T;
    curr = curr[part];
  }
  return curr !== undefined ? curr : (fallback as T);
}

/**
 * Large JSON stream chunk generator helper for memory-friendly streaming.
 */
export function* parseJsonStreamChunk(jsonArrayStr: string): Generator<any, void, unknown> {
  const trimmed = jsonArrayStr.trim().replace(/^\[|\]$/g, '');
  if (!trimmed) return;
  const items = trimmed.split(/\s*,\s*(?={)/);
  for (const item of items) {
    try {
      yield JSON.parse(item);
    } catch {
      // Ignore incomplete items in stream
    }
  }
}

/**
 * Returns key differences between two JSON objects.
 */
export function jsonDiff(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
): Record<string, any> {
  const diff: Record<string, any> = {};
  const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  keys.forEach((key) => {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      diff[key] = { from: obj1[key], to: obj2[key] };
    }
  });

  return diff;
}

/**
 * Flattens nested JSON objects into single level dot-notation key paths.
 */
export function flattenJson(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}
