import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable, useRowSelection, measureVirtualizer, serializeTableState } from './index';

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

  it('should handle sorting with accessors', () => {
    const columnsWithAccessor = [
      { key: 'name', header: 'Name' },
      { key: 'computed', header: 'Computed', accessor: (row: any) => row.age * 2 },
    ];
    const { result } = renderHook(() => useTable({ data: mockData, columns: columnsWithAccessor }));

    // Sort by computed ASC
    act(() => {
      result.current.handleSort('computed');
    });

    expect(result.current.sortDirection).toBe('asc');
    expect(result.current.paginatedData[0].name).toBe('Bob'); // age 25 * 2 = 50

    // Sort by computed DESC
    act(() => {
      result.current.handleSort('computed');
    });

    expect(result.current.sortDirection).toBe('desc');
    expect(result.current.paginatedData[0].name).toBe('Charlie'); // age 35 * 2 = 70
  });

  it('should generate CSV correctly', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    const csv = result.current.exportToCsv('test.csv');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('ID,Name,Age');
    expect(lines[1]).toBe('"1","Alice","30"');
    expect(lines.length).toBe(4); // header + 3 rows
  });

  it('should generate JSON export correctly', () => {
    const { result } = renderHook(() => useTable({ data: mockData, columns }));

    const json = result.current.exportToJson('test.json');
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(mockData);
  });

  describe('useRowSelection', () => {
    it('should exist', () => {
      expect(typeof useRowSelection).toBe('function');
    });
  });

  describe('multi-column sorting', () => {
    it('should handle multi-column sorting', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 },
      ];

      const { result } = renderHook(() => useTable({ data, columns }));

      // Sort by name ASC
      act(() => {
        result.current.handleSort('name', true);
      });

      // Then sort by age ASC
      act(() => {
        result.current.handleSort('age', true);
      });

      expect(result.current.multiSort.length).toBe(2);
      expect(result.current.paginatedData[0].name).toBe('Alice');
      expect(result.current.paginatedData[0].age).toBe(25); // Alice 25 comes before Alice 30
    });
  });

  describe('column resizing', () => {
    it('should update column widths', () => {
      const { result } = renderHook(() => useTable({ data: mockData, columns }));

      act(() => {
        result.current.handleColumnResize('name', 200);
      });

      expect(result.current.columnWidths['name']).toBe(200);
    });
  });

  describe('measureVirtualizer', () => {
    it('should measure virtualizer totalHeight and visibleNodes', () => {
      const result = measureVirtualizer(100, 40);
      expect(result.totalHeight).toBe(4000);
      expect(result.visibleNodes).toBe(25);
    });
  });

  describe('serializeTableState', () => {
    it('should format state into query parameters representation', () => {
      const res = serializeTableState({
        currentPage: 2,
        pageSize: 20,
        sortKey: 'name',
        sortDirection: 'desc',
        searchQuery: 'john',
      });
      expect(res).toEqual({
        page: 2,
        limit: 20,
        sort: 'name:desc',
        q: 'john',
      });
    });
  });

  describe('getSortDirection', () => {
    it('should correctly infer sort direction', () => {
      const { result } = renderHook(() => useTable({ data: mockData, columns }));

      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.getSortDirection('name')).toBe('asc');
      expect(result.current.getSortDirection('age')).toBe(null);

      act(() => {
        result.current.handleSort('name');
      });
      expect(result.current.getSortDirection('name')).toBe('desc');
    });

    it('should manage column visibility', () => {
      const { result } = renderHook(() => useTable({ data: mockData, columns }));

      expect(result.current.visibleColumns.length).toBe(3);

      act(() => {
        result.current.toggleColumnVisibility('age', false);
      });
      expect(result.current.visibleColumns.length).toBe(2);
      expect(result.current.visibleColumns.find((c) => c.key === 'age')).toBeUndefined();

      act(() => {
        result.current.toggleColumnVisibility('age');
      });
      expect(result.current.visibleColumns.length).toBe(3);

      act(() => {
        result.current.toggleAllColumnVisibility(false);
      });
      expect(result.current.visibleColumns.length).toBe(0);

      act(() => {
        result.current.toggleAllColumnVisibility(true);
      });
      expect(result.current.visibleColumns.length).toBe(3);
    });
  });

  describe('filterTableData', () => {
    it('should filter table data using custom column predicates', async () => {
      const { filterTableData } = await import('./index');
      const filtered = filterTableData(mockData, {
        age: (age) => age > 25,
        name: (name) => name === 'Alice',
      });
      expect(filtered).toEqual([{ id: 1, name: 'Alice', age: 30 }]);
    });
  });

  describe('resetTableState', () => {
    it('should return default table state', async () => {
      const { resetTableState } = await import('./index');
      expect(resetTableState()).toEqual({
        currentPage: 1,
        pageSize: 10,
        searchQuery: '',
        sortKey: null,
        sortDirection: 'asc',
      });
    });
  });

  describe('createHeadlessTableCore', () => {
    it('should compute headless table metadata', async () => {
      const { createHeadlessTableCore } = await import('./index');
      const core = createHeadlessTableCore([{ id: 1 }], [{ key: 'id' }]);
      expect(core.itemCount).toBe(1);
      expect(core.columnKeys).toEqual(['id']);
      expect(core.isEmpty).toBe(false);
    });
  });

  describe('createPivotTableCore', () => {
    it('should compute pivot matrix aggregates', async () => {
      const { createPivotTableCore } = await import('./index');
      const data = [
        { region: 'US', product: 'A', sales: 100 },
        { region: 'US', product: 'B', sales: 200 },
        { region: 'EU', product: 'A', sales: 150 },
      ];
      const pivot = createPivotTableCore(data, 'region', 'product', 'sales');
      expect(pivot.rows).toEqual(['US', 'EU']);
      expect(pivot.columns).toEqual(['A', 'B']);
      expect(pivot.matrix.US.A).toBe(100);
      expect(pivot.matrix.US.B).toBe(200);
    });
  });

  describe('useInlineCellEditor', () => {
    it('should manage cell editor state', async () => {
      const { useInlineCellEditor } = await import('./index');
      const { result } = renderHook(() => useInlineCellEditor());
      act(() => {
        result.current.startEditing(0, 'name', 'Alice');
      });
      expect(result.current.editingCell).toEqual({ rowIndex: 0, columnKey: 'name' });
      expect(result.current.editValue).toBe('Alice');

      act(() => {
        result.current.cancelEditing();
      });
      expect(result.current.editingCell).toBeNull();
    });
  });

  describe('createTreeGridNodes', () => {
    it('should flatten tree hierarchy with depth and hasChildren flags', async () => {
      const { createTreeGridNodes } = await import('./index');
      const tree = [{ id: '1', label: 'Root', children: [{ id: '1-1', label: 'Child' }] }];
      const nodes = createTreeGridNodes(tree);
      expect(nodes).toHaveLength(2);
      expect(nodes[0].depth).toBe(0);
      expect(nodes[0].hasChildren).toBe(true);
      expect(nodes[1].depth).toBe(1);
      expect(nodes[1].hasChildren).toBe(false);
    });
  });
});
