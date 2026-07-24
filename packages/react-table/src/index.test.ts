import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from './index';

// Polyfill URL.createObjectURL for the CSV export test
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
}

const mockData = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
];

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
];

describe('@typepurify/react-table', () => {
  it('should initialize correctly with data', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    expect(result.current.totalItems).toBe(3);
    expect(result.current.paginatedData.length).toBe(3);
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle pagination', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns, initialPageSize: 2 }));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedData.length).toBe(2);
    expect(result.current.paginatedData[0].name).toBe('Alice');

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.paginatedData.length).toBe(1);
    expect(result.current.paginatedData[0].name).toBe('Charlie');
  });

  it('should handle search filtering', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    act(() => {
      result.current.setSearchQuery('bob');
    });

    expect(result.current.totalItems).toBe(1);
    expect(result.current.paginatedData[0].name).toBe('Bob');
  });

  it('should handle sorting', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    // Sort by age ASC
    act(() => {
      result.current.handleSort('age');
    });

    expect(result.current.sortDirection).toBe('asc');
    expect(result.current.paginatedData[0].name).toBe('Bob'); // age 25

    // Sort by age DESC
    act(() => {
      result.current.handleSort('age');
    });

    expect(result.current.sortDirection).toBe('desc');
    expect(result.current.paginatedData[0].name).toBe('Charlie'); // age 35
  });

  it('should generate CSV correctly', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    const csv = result.current.exportToCsv('test.csv');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('ID,Name,Age');
    expect(lines[1]).toBe('"1","Alice","30"');
    expect(lines.length).toBe(4); // header + 3 rows
  });
});
