import { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface UseTableOptions<T> {
  data: T[];
  columns: Column<T>[];
  initialPageSize?: number;
}

export function useTable<T>({ data, columns, initialPageSize = 10 }: UseTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const processedData = useMemo(() => {
    const result = [...data];

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * pageSize;
    return result.slice(startIndex, startIndex + pageSize);
  }, [data, sortKey, sortDirection, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  return {
    columns,
    data: processedData,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    setCurrentPage,
    handleSort,
    sortKey,
    sortDirection,
  };
}
