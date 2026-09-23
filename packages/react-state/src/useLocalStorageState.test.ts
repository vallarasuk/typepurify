import { describe, it, expect } from 'vitest';
import { useLocalStorageState } from './useLocalStorageState';
describe('useLocalStorageState', () => {
  it('should return initial', () => {
    expect(useLocalStorageState('k', 1)[0]).toBe(1);
  });
});
