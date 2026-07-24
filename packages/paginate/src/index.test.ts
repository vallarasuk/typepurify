import { describe, it, expect, vi } from 'vitest';
import { parseCursor, createCursor, parseOffset, InfiniteScrollManager } from './index';

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
});
