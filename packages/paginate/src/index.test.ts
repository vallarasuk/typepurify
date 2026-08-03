import { describe, it, expect, vi } from 'vitest';
import {
  parseCursor,
  createCursor,
  parseOffset,
  InfiniteScrollManager,
  extractCursor,
  preFetchCursor,
  createCursorPaginator,
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

  describe('createCursorPaginator', () => {
    it('should paginate items using cursor tokens', () => {
      const data = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const paginator = createCursorPaginator(data, (item) => item.id);

      const page1 = paginator(undefined, 2);
      expect(page1.items.length).toBe(2);
      expect(page1.pageInfo.hasNextPage).toBe(true);
      expect(page1.pageInfo.nextCursor).toBe('2');

      const page2 = paginator('2', 2);
      expect(page2.items.length).toBe(1);
      expect(page2.items[0].name).toBe('C');
      expect(page2.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('calculateTotalPages', () => {
    it('should correctly calculate total pages', async () => {
      const { calculateTotalPages } = await import('./index');
      expect(calculateTotalPages(10, 5)).toBe(2);
      expect(calculateTotalPages(11, 5)).toBe(3);
      expect(calculateTotalPages(0, 5)).toBe(0);
      expect(calculateTotalPages(5, 0)).toBe(0);
    });
  });

  describe('calculateHasPreviousPage and calculateHasNextPage', () => {
    it('should correctly determine previous page existence', async () => {
      const { calculateHasPreviousPage } = await import('./index');
      expect(calculateHasPreviousPage(1)).toBe(false);
      expect(calculateHasPreviousPage(0)).toBe(false);
      expect(calculateHasPreviousPage(2)).toBe(true);
    });

    it('should correctly determine next page existence', async () => {
      const { calculateHasNextPage } = await import('./index');
      expect(calculateHasNextPage(1, 2)).toBe(true);
      expect(calculateHasNextPage(2, 2)).toBe(false);
      expect(calculateHasNextPage(1, 0)).toBe(false);
    });
  });

  describe('paginateArrayWindow', () => {
    it('should generate page numbers array window', async () => {
      const { paginateArrayWindow } = await import('./index');
      expect(paginateArrayWindow(1, 10, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(paginateArrayWindow(5, 10, 5)).toEqual([3, 4, 5, 6, 7]);
      expect(paginateArrayWindow(10, 10, 5)).toEqual([6, 7, 8, 9, 10]);
    });
  });

  describe('getPageOffset', () => {
    it('should calculate offset correctly', async () => {
      const { getPageOffset } = await import('./index');
      expect(getPageOffset(1, 10)).toBe(0);
      expect(getPageOffset(2, 10)).toBe(10);
      expect(getPageOffset(3, 20)).toBe(40);
    });
  });

  describe('parseRelayParams', () => {
    it('should parse Relay connection parameters into limit and offset', async () => {
      const { parseRelayParams, createCursor } = await import('./index');
      const cursor = createCursor('5');

      const params = parseRelayParams(10, cursor);
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(6);
    });
  });
});
