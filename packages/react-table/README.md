<div align="center">
  <h1>✨ @typepurify/react-table</h1>
  <p>Universal, zero-dependency Data Table utilities for sorting, filtering, and pagination.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/react-table.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/react-table)

## 🚀 Overview

`@typepurify/react-table` provides highly optimized hooks for rendering and managing massive data tables in React without relying on heavy DOM-bound libraries.

## 📦 Installation

```bash
npm install @typepurify/react-table
```

## 🛠 Features & Usage

### 1. `useTable`

The core engine for your tables. Supports Multi-sorting, Search, Pagination, Column Visiblity, and native CSV Export.

```tsx
import { useTable } from '@typepurify/react-table';

const data = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

function MyTable() {
  const {
    paginatedData,
    visibleColumns,
    handleSort,
    setSearchQuery,
    exportToCsv,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useTable({
    data,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name', accessor: (row) => row.name.toUpperCase() },
    ],
    initialPageSize: 10,
  });

  return (
    <div>
      <input placeholder="Search..." onChange={(e) => setSearchQuery(e.target.value)} />
      <button onClick={() => exportToCsv('users.csv')}>Export</button>

      <table>
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
```

### 2. `useRowSelection`

Effortlessly manage selected rows for bulk actions.

```tsx
import { useRowSelection } from '@typepurify/react-table';

const { selectedRowIds, toggleRowSelected, toggleAllRowsSelected } = useRowSelection();
```

### 3. URL State Serialization

Synchronize your table state (page, limit, sort) directly to your URL query params.

```typescript
import { serializeTableState } from '@typepurify/react-table';

const queryParams = serializeTableState({
  currentPage: 2,
  pageSize: 20,
  sortKey: 'name',
  sortDirection: 'asc',
});
// => { page: 2, limit: 20, sort: 'name:asc' }
```

### 4. Bulk Column Visibility

Easily toggle visibility for all columns at once.

```tsx
import { toggleAllColumnVisibility } from '@typepurify/react-table';

// Hide all columns
const nextVisibility = toggleAllColumnVisibility(currentVisibility, false);
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
