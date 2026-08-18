import { useState, useMemo, useEffect } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => any;
}

export interface UseTableOptions<T> {
  data: T[];
  columns: Column<T>[];
  initialPageSize?: number;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export function useTable<T>(options: UseTableOptions<T>) {
  const [data, setData] = useState<T[]>(options.data);
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [multiSort, setMultiSort] = useState<SortState[]>([]);

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Column Visibility State
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.initialPageSize ?? 10);

  // Derived Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search / Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return options.columns.some((col) => {
          const val = col.accessor ? col.accessor(row) : (row as any)[col.key];
          return String(val).toLowerCase().includes(lowerQuery);
        });
      });
    }

    // Sort (Optimized)
    if (multiSort.length > 0) {
      // Pre-compute accessors
      const mapped = result.map((item, index) => {
        const values: Record<string, any> = {};
        for (const sort of multiSort) {
          const col = options.columns.find((c) => c.key === sort.key);
          values[sort.key] = col?.accessor ? col.accessor(item) : (item as any)[sort.key];
        }
        return { index, values };
      });

      mapped.sort((a, b) => {
        for (const sort of multiSort) {
          const valA = a.values[sort.key];
          const valB = b.values[sort.key];
          if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      result = mapped.map((el) => result[el.index]);
    } else if (sortKey && sortDirection) {
      const col = options.columns.find((c) => c.key === sortKey);
      if (col) {
        const mapped = result.map((item, index) => {
          return {
            index,
            value: col.accessor ? col.accessor(item) : (item as any)[sortKey],
          };
        });

        mapped.sort((a, b) => {
          if (a.value < b.value) return sortDirection === 'asc' ? -1 : 1;
          if (a.value > b.value) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });

        result = mapped.map((el) => result[el.index]);
      }
    }

    return result;
  }, [data, searchQuery, sortKey, sortDirection, multiSort, options.columns]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // Actions
  const handleSort = (key: string, isMulti: boolean = false) => {
    if (isMulti) {
      setMultiSort((prev) => {
        const existing = prev.find((s) => s.key === key);
        if (existing) {
          if (existing.direction === 'asc') {
            return prev.map((s) => (s.key === key ? { ...s, direction: 'desc' as const } : s));
          } else {
            return prev.filter((s) => s.key !== key);
          }
        } else {
          return [...prev, { key, direction: 'asc' as const }];
        }
      });
      // Clear single sort state
      setSortKey(null);
      setSortDirection(null);
    } else {
      // Clear multi sort state
      setMultiSort([]);
      if (sortKey === key) {
        if (sortDirection === 'asc') setSortDirection('desc');
        else if (sortDirection === 'desc') {
          setSortDirection(null);
          setSortKey(null);
        }
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    }
  };

  const handleColumnResize = (key: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [key]: width }));
  };

  const exportToCsv = (filename: string = 'export.csv') => {
    const headers = options.columns.map((c) => c.header).join(',');
    const rows = processedData.map((row) => {
      return options.columns
        .map((col) => {
          const val = col.accessor ? col.accessor(row) : (row as any)[col.key];
          // Escape quotes
          const stringVal = String(val ?? '').replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    // Create download trigger (client side only)
    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return csvContent;
  };

  const exportToJson = (filename: string = 'export.json') => {
    const jsonContent = JSON.stringify(processedData, null, 2);

    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return jsonContent;
  };

  const toggleColumnVisibility = (key: string, isVisible?: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: isVisible !== undefined ? isVisible : !(prev[key] ?? true),
    }));
  };

  const toggleAllColumnVisibility = (isVisible: boolean) => {
    const next: Record<string, boolean> = {};
    options.columns.forEach((c) => {
      next[c.key as string] = isVisible;
    });
    setColumnVisibility(next);
  };

  const visibleColumns = useMemo(() => {
    return options.columns.filter((c) => columnVisibility[c.key as string] !== false);
  }, [options.columns, columnVisibility]);

  return {
    // State
    searchQuery,
    sortKey,
    sortDirection,
    multiSort,
    currentPage,
    pageSize,
    totalPages,
    totalItems: processedData.length,
    columnWidths,
    columnVisibility,
    visibleColumns,

    // Data
    paginatedData,
    processedData,

    // Actions
    setSearchQuery,
    setCurrentPage,
    setPageSize,
    handleSort,
    getSortDirection: (key: string) => {
      if (sortKey === key) return sortDirection;
      const multi = multiSort.find((s) => s.key === key);
      return multi ? multi.direction : null;
    },
    handleColumnResize,
    toggleColumnVisibility,
    toggleAllColumnVisibility,
    exportToCsv,
    exportToJson,
    setData,
  };
}

export function useRowSelection() {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const toggleRowSelected = (id: string, value?: boolean) => {
    setSelectedRowIds((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: value !== undefined ? value : !prev[id],
    }));
  };
  const toggleAllRowsSelected = (ids: string[], value: boolean) => {
    const next: Record<string, boolean> = {};
    if (value)
      ids.forEach((id) => {
        next[id] = true;
      });
    setSelectedRowIds(next);
  };
  return { selectedRowIds, toggleRowSelected, toggleAllRowsSelected };
}

/**
 * Core virtualizer module for lightning-fast React data table rendering.
 */
export function measureVirtualizer(rowCount: number, rowHeight: number, scrollTop = 0) {
  const safeRowHeight = rowHeight > 0 ? rowHeight : 35; // Default height if DOM is not painted
  const totalHeight = rowCount * safeRowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / safeRowHeight));
  const visibleNodes = Math.ceil(1000 / safeRowHeight);
  return {
    totalHeight,
    startIndex,
    endIndex: Math.min(rowCount, startIndex + visibleNodes + 2), // Overscan buffer prevents scrollbar jump
    visibleNodes,
    offsetY: startIndex * safeRowHeight,
  };
}

export function useVirtualizer(rowCount: number, rowHeight: number, scrollTop = 0) {
  return useMemo(
    () => measureVirtualizer(rowCount, rowHeight, scrollTop),
    [rowCount, rowHeight, scrollTop],
  );
}

/**
 * Serializes table pagination, sorting, and search state into a URL or storage friendly object.
 */
export function serializeTableState(state: {
  currentPage?: number;
  pageSize?: number;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
}) {
  return {
    page: state.currentPage ?? 1,
    limit: state.pageSize ?? 10,
    sort: state.sortKey ? `${state.sortKey}:${state.sortDirection || 'asc'}` : undefined,
    q: state.searchQuery || undefined,
  };
}

/**
 * Custom column predicate filter helper for complex queries.
 */
export function filterTableData<T>(data: T[], filters: Record<string, (val: any) => boolean>): T[] {
  return data.filter((row: any) => {
    for (const [key, predicate] of Object.entries(filters)) {
      if (!predicate(row[key])) return false;
    }
    return true;
  });
}

/**
 * Resets table state options to standard defaults.
 */
export function resetTableState() {
  return {
    currentPage: 1,
    pageSize: 10,
    searchQuery: '',
    sortKey: null,
    sortDirection: 'asc' as const,
  };
}

/**
 * Headless UI table core helper for unstyled headless table state computation.
 */
export function createHeadlessTableCore<T>(data: T[], columns: Array<{ key: string }>) {
  return {
    itemCount: data.length,
    columnKeys: columns.map((c) => c.key),
    isEmpty: data.length === 0,
  };
}

/**
 * Headless Pivot Table aggregation core helper.
 */
export function createPivotTableCore<T extends Record<string, any>>(
  data: T[],
  rowKey: keyof T,
  colKey: keyof T,
  valKey: keyof T,
) {
  const pivotMap: Record<string, Record<string, number>> = {};
  const columns = new Set<string>();

  for (const row of data) {
    const rVal = String(row[rowKey] ?? '');
    const cVal = String(row[colKey] ?? '');
    const vVal = Number(row[valKey] ?? 0);

    columns.add(cVal);
    if (!pivotMap[rVal]) pivotMap[rVal] = {};
    pivotMap[rVal][cVal] = (pivotMap[rVal][cVal] || 0) + vVal;
  }

  return {
    rows: Object.keys(pivotMap),
    columns: Array.from(columns),
    matrix: pivotMap,
  };
}

/**
 * React hook for managing inline cell edit states in Data Tables.
 */
export function useInlineCellEditor() {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(
    null,
  );
  const [editValue, setEditValue] = useState<any>(null);

  const startEditing = (rowIndex: number, columnKey: string, initialValue: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(initialValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue(null);
  };

  return { editingCell, editValue, setEditValue, startEditing, cancelEditing };
}

/**
 * Creates a flat node list for rendering hierarchical tree-grid data structures.
 */
export function createTreeGridNodes<T extends { id: string; children?: T[] }>(
  items: T[],
  depth = 0,
): Array<T & { depth: number; hasChildren: boolean }> {
  const result: Array<T & { depth: number; hasChildren: boolean }> = [];
  for (const item of items) {
    result.push({ ...item, depth, hasChildren: Boolean(item.children?.length) });
    if (item.children?.length) {
      result.push(...createTreeGridNodes(item.children, depth + 1));
    }
  }
  return result;
}

/**
 * Persist the core column resizer hook for syncing grid layout with localStorage.
 */
export function usePersistentColumnResizer(
  storageKey: string,
  defaultWidths: Record<string, number> = {},
) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore parse errors
        }
      }
    }

    return defaultWidths;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify(widths));
    }
  }, [widths, storageKey]);

  const setColumnWidth = (columnKey: string, width: number) => {
    setWidths((prev) => ({ ...prev, [columnKey]: width }));
  };

  return { widths, setColumnWidth };
}

/**
 * Traverses CRDT operations to rebuild multiplayer table state.
 */
export function traverseCRDTMultiplayerHook(
  operations: Array<{ type: 'insert' | 'delete'; id: string; value?: any }>,
): Record<string, any> {
  const state: Record<string, any> = {};
  for (const op of operations) {
    if (op.type === 'insert') {
      state[op.id] = op.value;
    } else if (op.type === 'delete') {
      delete state[op.id];
    }
  }
  return state;
}
