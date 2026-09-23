import { describe, it, expect } from 'vitest';
import { CursorPaginator } from './CursorPaginator';
describe('CursorPaginator', () => {
  it('should paginate', () => {
    const p = new CursorPaginator();
    expect(p.paginate([], 'a')).toEqual([]);
  });
});
