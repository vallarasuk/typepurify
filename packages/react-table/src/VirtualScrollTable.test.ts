import { describe, it, expect } from 'vitest';
import { VirtualScrollTable } from './VirtualScrollTable';
describe('VirtualScrollTable', () => {
  it('should render', () => {
    const t = new VirtualScrollTable();
    expect(t.render()).toBe('table');
  });
});
