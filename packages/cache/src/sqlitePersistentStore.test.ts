import { describe, it, expect, vi } from 'vitest';
import { SqlitePersistentStore } from './sqlitePersistentStore';

// Mock sqlite3 behavior
vi.mock('sqlite3', () => {
  return {
    Database: class {
      run(query: string, params: any, cb: any) {
        if (cb) cb(null);
        else if (typeof params === 'function') params(null);
      }
      get(query: string, params: any, cb: any) {
        cb(null, null); // Return not found
      }
    },
  };
});

describe('SqlitePersistentStore', () => {
  it('should initialize and run set operations', async () => {
    const store = new SqlitePersistentStore();
    // Wait for the async table creation to finish
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(store.set('key1', { value: 1 })).resolves.toBeUndefined();
    await expect(store.get('key1')).resolves.toEqual({ value: 1 });
  });
});
