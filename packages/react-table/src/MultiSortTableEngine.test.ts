import { describe, it, expect } from 'vitest';
import { MultiSortTableEngine } from './MultiSortTableEngine';

describe('MultiSortTableEngine', () => {
  it('should sort rows by multiple columns with asc/desc rules', () => {
    const data = [
      { id: 1, department: 'Engineering', score: 90, nullVal: null },
      { id: 2, department: 'Sales', score: 85 },
      { id: 3, department: 'Engineering', score: 95 },
      { id: 4, department: 'Sales', score: 90 },
    ];

    const sorted = MultiSortTableEngine.sortRows(data, [
      { key: 'department', direction: 'asc' },
      { key: 'score', direction: 'desc' },
    ]);

    expect(sorted.map((r) => r.id)).toEqual([3, 1, 4, 2]);
    expect((sorted[0] as any).nullVal).toBeUndefined(); // purified!
  });

  it('should position nulls according to nulls option', () => {
    const data = [
      { id: 1, age: 25 },
      { id: 2, age: null },
      { id: 3, age: 30 },
    ];

    const sortedNullsLast = MultiSortTableEngine.sortRows(data, [
      { key: 'age', direction: 'asc', nulls: 'last' },
    ]);
    expect(sortedNullsLast.map((r) => r.id)).toEqual([1, 3, 2]);

    const sortedNullsFirst = MultiSortTableEngine.sortRows(data, [
      { key: 'age', direction: 'asc', nulls: 'first' },
    ]);
    expect(sortedNullsFirst.map((r) => r.id)).toEqual([2, 1, 3]);
  });
});
