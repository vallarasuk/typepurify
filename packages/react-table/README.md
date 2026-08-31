<div align="center">
  <h1>✨ @typepurify/react-table</h1>
  <p>Universal, zero-dependency Data Table utilities for sorting, filtering, and pagination.</p>
</div>

**New in v0.5.14**: Added `useInlineEditor` — a hook for inline table cell editing state.

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
    clearSort, // v0.5.11 🚀
    setSortKey, // v0.5.11 🚀
    setSortDirection, // v0.5.11 🚀
    setMultiSort, // v0.5.11 🚀
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

## 🆕 New in v0.5.8

### `createTreeGridNodes(items, depth?)` — Tree Grid Flattener

Flattens a recursive tree structure into a depth-annotated flat list for virtualized tree-grid rendering.

```typescript
import { createTreeGridNodes } from '@typepurify/react-table';

const nodes = createTreeGridNodes([
  { id: '1', label: 'Root', children: [{ id: '1-1', label: 'Child' }] },
]);
// => [{ id: "1", depth: 0, hasChildren: true, ... }, { id: "1-1", depth: 1, hasChildren: false, ... }]
```

### `useInlineCellEditor()` — Inline Cell Edit Hook

Manages per-cell edit state in inline editable tables.

```typescript
import { useInlineCellEditor } from '@typepurify/react-table';

const { editingCell, editValue, startEditing, cancelEditing } = useInlineCellEditor();
startEditing(0, 'name', 'Alice');
// editingCell => { rowIndex: 0, columnKey: "name" }
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`createHeadlessTableCore(data, columns)`** — Computes unstyled headless table metadata: `itemCount`, `columnKeys`, and `isEmpty`. Use as the foundation for building fully custom UI table renderers.

```typescript
import { createHeadlessTableCore } from '@typepurify/react-table';

const core = createHeadlessTableCore(
  [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  [{ key: 'id' }, { key: 'name' }],
);

console.log(core.itemCount); // 2
console.log(core.columnKeys); // ['id', 'name']
console.log(core.isEmpty); // false
```

**Bug Fixes:**

- Fixed virtualizer scrollbar jump in `measureVirtualizer` by caching scroll position before re-measurement.

### v0.5.1

- Added `toggleAllColumnVisibility` for bulk column toggling.

## 0.5.8 Updates

Includes new features.
