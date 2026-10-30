export type JsonPatchOp =
  | { op: 'add'; path: string; value: any }
  | { op: 'remove'; path: string }
  | { op: 'replace'; path: string; value: any }
  | { op: 'move'; from: string; path: string }
  | { op: 'copy'; from: string; path: string }
  | { op: 'test'; path: string; value: any };

/**
 * RFC 6902 JSON Patch implementation with path safety and clean mutations.
 */
export class JsonPatch {
  static apply(doc: Record<string, any>, patches: JsonPatchOp[]): Record<string, any> {
    const clone = JSON.parse(JSON.stringify(doc));

    for (const patch of patches) {
      switch (patch.op) {
        case 'add':
        case 'replace': {
          JsonPatch.setPath(clone, patch.path, patch.value);
          break;
        }
        case 'remove': {
          JsonPatch.removePath(clone, patch.path);
          break;
        }
        case 'copy': {
          const val = JsonPatch.getPath(clone, patch.from);
          JsonPatch.setPath(clone, patch.path, JSON.parse(JSON.stringify(val)));
          break;
        }
        case 'move': {
          const val = JsonPatch.getPath(clone, patch.from);
          JsonPatch.removePath(clone, patch.from);
          JsonPatch.setPath(clone, patch.path, val);
          break;
        }
        case 'test': {
          const val = JsonPatch.getPath(clone, patch.path);
          if (JSON.stringify(val) !== JSON.stringify(patch.value)) {
            throw new Error(`Test failed for path "${patch.path}"`);
          }
          break;
        }
      }
    }

    return clone;
  }

  private static parsePath(path: string): string[] {
    if (!path.startsWith('/')) {
      throw new Error(`Invalid JSON Pointer path "${path}". Must start with "/".`);
    }
    return path
      .slice(1)
      .split('/')
      .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  }

  private static getPath(target: any, path: string): any {
    const parts = JsonPatch.parsePath(path);
    let curr = target;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  private static setPath(target: any, path: string, value: any): void {
    const parts = JsonPatch.parsePath(path);
    let curr = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') return;
      if (!curr[part] || typeof curr[part] !== 'object') {
        curr[part] = {};
      }
      curr = curr[part];
    }
    const last = parts[parts.length - 1];
    if (last !== '__proto__' && last !== 'constructor' && last !== 'prototype') {
      if (Array.isArray(curr) && last === '-') {
        curr.push(value);
      } else {
        curr[last] = value;
      }
    }
  }

  private static removePath(target: any, path: string): void {
    const parts = JsonPatch.parsePath(path);
    let curr = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!curr || typeof curr !== 'object') return;
      curr = curr[part];
    }
    const last = parts[parts.length - 1];
    if (Array.isArray(curr)) {
      const index = parseInt(last, 10);
      if (!isNaN(index) && index >= 0 && index < curr.length) {
        curr.splice(index, 1);
      }
    } else if (curr && typeof curr === 'object') {
      delete curr[last];
    }
  }
}
