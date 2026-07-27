import { useState, useMemo } from 'react';

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

    // Data
    paginatedData,
    processedData,

    // Actions
    setSearchQuery,
    setCurrentPage,
    setPageSize,
    handleSort,
    handleColumnResize,
    exportToCsv,
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
export function measureVirtualizer(rowCount: number, rowHeight: number) {
  return {
    totalHeight: rowCount * rowHeight,
    visibleNodes: Math.ceil(1000 / rowHeight),
  };
}
