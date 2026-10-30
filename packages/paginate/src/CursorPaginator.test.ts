import { describe, it, expect } from 'vitest';
import { CursorPaginator } from './CursorPaginator';

describe('CursorPaginator', () => {
  const items = [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
    { id: '3', name: 'C' },
    { id: '4', name: 'D' },
    { id: '5', name: 'E' },
  ];

  it('should paginate items from start and return nextCursor', () => {
    const paginator = new CursorPaginator();
    const page1 = paginator.paginate(items, null, 2);

    expect(page1.data).toHaveLength(2);
    expect(page1.data[0].id).toBe('1');
    expect(page1.nextCursor).toBe('2');
    expect(page1.hasMore).toBe(true);

    const page2 = paginator.paginate(items, page1.nextCursor, 2);
    expect(page2.data).toHaveLength(2);
    expect(page2.data[0].id).toBe('3');
    expect(page2.nextCursor).toBe('4');
    expect(page2.hasMore).toBe(true);

    const page3 = paginator.paginate(items, page2.nextCursor, 2);
    expect(page3.data).toHaveLength(1);
    expect(page3.data[0].id).toBe('5');
    expect(page3.nextCursor).toBeNull();
    expect(page3.hasMore).toBe(false);
  });
});
