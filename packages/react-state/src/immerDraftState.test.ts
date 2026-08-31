import { describe, it, expect } from 'vitest';
import { produce } from './immerDraftState';

describe('immerDraftState', () => {
  it('should apply produce mock correctly', () => {
    const base = { count: 1 };
    const next = produce(base, (draft) => {
      draft.count = 2;
    });
    expect(next.count).toBe(2);
    expect(base.count).toBe(1); // Immutability maintained by mock
  });
});
