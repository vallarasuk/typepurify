import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from './index';

interface User {
  id: number;
  name: string;
  age: number;
}

const MOCK_DATA: User[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
];

const MOCK_COLUMNS = [
  { key: 'id' as const, title: 'ID' },
  { key: 'name' as const, title: 'Name' },
  { key: 'age' as const, title: 'Age' },
];

describe('@typepurify/react-table', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() =>
      useTable({
        data: MOCK_DATA,
        columns: MOCK_COLUMNS,
        initialPageSize: 2,
      }),
    );

    expect(result.current.data.length).toBe(2);
    expect(result.current.data[0].name).toBe('Alice');
    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle pagination', () => {
    const { result } = renderHook(() =>
      useTable({
        data: MOCK_DATA,
        columns: MOCK_COLUMNS,
        initialPageSize: 2,
      }),
    );

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.data.length).toBe(1);
    expect(result.current.data[0].name).toBe('Charlie');
  });

  it('should handle sorting', () => {
    const { result } = renderHook(() =>
      useTable({
        data: MOCK_DATA,
        columns: MOCK_COLUMNS,
        initialPageSize: 10,
      }),
    );

    // Initial order: Alice, Bob, Charlie

    act(() => {
      result.current.handleSort('age');
    });

    // Ascending sort by age: Bob (25), Alice (30), Charlie (35)
    expect(result.current.data[0].name).toBe('Bob');
    expect(result.current.data[2].name).toBe('Charlie');
    expect(result.current.sortDirection).toBe('asc');

    act(() => {
      result.current.handleSort('age');
    });

    // Descending sort by age: Charlie (35), Alice (30), Bob (25)
    expect(result.current.data[0].name).toBe('Charlie');
    expect(result.current.data[2].name).toBe('Bob');
    expect(result.current.sortDirection).toBe('desc');
  });
});
