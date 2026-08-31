import { describe, it, expect } from 'vitest';
import { CrdtSynchronizer } from './crdtSynchronizer';

describe('CrdtSynchronizer', () => {
  it('should apply operations deterministically (Last Write Wins)', () => {
    const crdt = new CrdtSynchronizer();
    crdt.apply([
      { id: '1', key: 'a', value: 10, type: 'set', timestamp: 100 },
      { id: '2', key: 'a', value: 20, type: 'set', timestamp: 150 },
      { id: '3', key: 'a', value: 5, type: 'set', timestamp: 50 }, // Out of order, should be ignored
    ]);
    expect(crdt.getState()).toEqual({ a: 20 });
  });
});
