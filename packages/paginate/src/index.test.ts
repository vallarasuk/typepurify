import { describe, it, expect, vi } from 'vitest';
import {
  parseCursor,
  createCursor,
  parseOffset,
  InfiniteScrollManager,
  extractCursor,
  preFetchCursor,
} from './index';

describe('@typepurify/paginate', () => {
  describe('cursor parsing', () => {
    it('should create and parse a cursor', () => {
      const original = 'test-cursor-123';
      const encoded = createCursor(original);
      expect(encoded).not.toBe(original);
      const decoded = parseCursor(encoded);
      expect(decoded).toBe(original);
    });

    it('should fallback to original string if decoding fails', () => {
      expect(parseCursor('invalid-base64@#$')).toBe('invalid-base64@#$');
    });
  });

  describe('offset parsing', () => {
    it('should correctly calculate offset', () => {
      expect(parseOffset(1, 10)).toBe(0);
      expect(parseOffset(2, 10)).toBe(10);
      expect(parseOffset(3, 20)).toBe(40);
    });

    it('should clamp negative or zero pages to 1', () => {
      expect(parseOffset(0, 10)).toBe(0);
      expect(parseOffset(-5, 10)).toBe(0);
    });
  });

  describe('InfiniteScrollManager', () => {
    it('should manage load states correctly', () => {
      const manager = new InfiniteScrollManager();
      const listener = vi.fn();
      manager.subscribe(listener);

      expect(manager.getState().page).toBe(1);
      expect(manager.getState().hasMore).toBe(true);

      // Start load
      expect(manager.startLoad()).toBe(true);
      expect(manager.getState().isLoading).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      // Cannot start another load
      expect(manager.startLoad()).toBe(false);

      // Complete load with full page
      manager.completeLoad(10, 10);
      expect(manager.getState().isLoading).toBe(false);
      expect(manager.getState().hasMore).toBe(true);
      expect(manager.getState().page).toBe(2);
      expect(listener).toHaveBeenCalledTimes(2);

      // Next load
      manager.startLoad();

      // Complete load with partial page (end of list)
      manager.completeLoad(5, 10);
      expect(manager.getState().hasMore).toBe(false);
      expect(manager.getState().page).toBe(2); // Page doesn't increment if no more

      // Try load when no more
      expect(manager.startLoad()).toBe(false);
    });

    it('should handle errors', () => {
      const manager = new InfiniteScrollManager();
      manager.startLoad();
      manager.failLoad(new Error('Network error'));

      expect(manager.getState().isLoading).toBe(false);
      expect(manager.getState().error?.message).toBe('Network error');

      manager.reset();
      expect(manager.getState().page).toBe(1);
      expect(manager.getState().error).toBeNull();
    });
  });

  describe('extractCursor', () => {
    it('should extract cursor from object', () => {
      expect(extractCursor({ next_cursor: 'abc' })).toBe('abc');
      expect(extractCursor({ cursor: 'xyz' })).toBe('xyz');
      expect(extractCursor({ id: 123 })).toBe('123');
    });
    it('should extract cursor from array of objects', () => {
      expect(extractCursor([{ id: 1 }, { id: 2 }])).toBe('2');
    });
    it('should return undefined if not found', () => {
      expect(extractCursor({ name: 'test' })).toBeUndefined();
      expect(extractCursor(null)).toBeUndefined();
    });
  });

  describe('paginateAll', () => {
    it('should iterate through all pages', async () => {
      const { paginateAll } = await import('./index');

      const pages = [
        { items: [1, 2], nextCursor: 'A' },
        { items: [3, 4], nextCursor: 'B' },
        { items: [5], nextCursor: undefined },
      ];

      let callCount = 0;
      const fetchPage = async () => {
        return pages[callCount++];
      };

      const results: number[] = [];
      for await (const items of paginateAll(fetchPage)) {
        results.push(...items);
      }

      expect(results).toEqual([1, 2, 3, 4, 5]);
      expect(callCount).toBe(3);
    });
  });

  describe('buildConnection', () => {
    it('should build a Relay-compliant connection', async () => {
      const { buildConnection } = await import('./index');
      const items = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];

      const connection = buildConnection(items, (item) => item.id, true, false, 100);

      expect(connection.edges.length).toBe(2);
      expect(connection.edges[0].node.name).toBe('A');
      expect(connection.edges[0].cursor).toBe('1');
      expect(connection.pageInfo.hasNextPage).toBe(true);
      expect(connection.pageInfo.hasPreviousPage).toBe(false);
      expect(connection.pageInfo.startCursor).toBe('1');
      expect(connection.pageInfo.endCursor).toBe('2');
      expect(connection.totalCount).toBe(100);
    });
  });

  describe('preFetchCursor', () => {
    it('should pre-fetch cursor and return object with cursorId and limit', async () => {
      const result = await preFetchCursor('cursor_123', 20);
      expect(result).toEqual({ cursorId: 'cursor_123', limit: 20 });
    });
  });
});
