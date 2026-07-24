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
export function removeCircular(obj: any): any {
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
    for (const key in val) {
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
export function compareIgnoreKeys(obj1: any, obj2: any, ignoreKeys: string[] = []): boolean {
  const diff = deepDiff(obj1, obj2);

  if (!diff) return true;

  // Check if all diffs are in ignoreKeys
  function checkDiff(d: any, path: string): boolean {
    if (ignoreKeys.includes(path)) return true;

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
