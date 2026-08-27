<div align="center">
  <h1>✨ @typepurify/paginate</h1>
  <p>Smart pagination utilities and offset/cursor-based calculation engines.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/paginate.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/paginate)

## 🚀 Overview

`@typepurify/paginate` simplifies complex pagination logic. Whether you need standard offset calculations, Relay-compliant GraphQL connections, or infinite scroll state machines, this zero-dependency library has you covered.

## 📦 Installation

```bash
npm install @typepurify/paginate
```

## 🛠 Features & Examples

### 1. Cursor Pagination & Relay Connections

Build secure base64 cursors and standard Relay-compliant connections.

```typescript
import { buildConnection, createCursor, parseCursor } from '@typepurify/paginate';

const items = [
  { id: 'item1', name: 'A' },
  { id: 'item2', name: 'B' },
];

// Creates a Relay-compliant connection object
const connection = buildConnection(
  items,
  (item) => createCursor(item.id), // Base64 encodes the ID
  true, // hasNextPage
  false, // hasPreviousPage
);
```

### 2. Auto-Paginator Generator (`paginateAll`)

Automatically loop through all paginated API responses seamlessly using an AsyncGenerator.

```typescript
import { paginateAll } from '@typepurify/paginate';

const fetchUsers = async (cursor) => {
  const res = await api.get(`/users?cursor=${cursor || ''}`);
  return { items: res.data, nextCursor: res.next_cursor };
};

// Automatically iterates until all pages are exhausted!
for await (const users of paginateAll(fetchUsers)) {
  console.log('Fetched batch of users:', users);
}
```

### 3. Infinite Scroll Manager

A UI-agnostic state machine to manage infinite scroll loaders.

```typescript
import { InfiniteScrollManager } from '@typepurify/paginate';

const scroll = new InfiniteScrollManager();

if (scroll.startLoad()) {
  try {
    const data = await fetchMoreData();
    scroll.completeLoad(data.length, 20); // Notifies subscribers and calculates `hasMore`
  } catch (err) {
    scroll.failLoad(err);
  }
}
```

### 4. Utilities

- `parseOffset(page, limit)`: Converts 1-indexed page/limit into 0-indexed SQL offsets.
- `extractCursor(data)`: Intelligently tries to find a cursor in a dynamic API response object.
- `calculateTotalPages(total, limit)`
- `getPaginationInfo(total, limit, current)`: Calculates comprehensive pagination metadata from dataset stats (v0.5.11 🚀).
- `createCursorPaginator(items, cursorExtractor)`: Paginates static arrays using cursors.

### 5. Advanced Pagination State

Calculate previous and next page availability dynamically based on current page and total pages.

```typescript
import { calculateHasNextPage, calculateHasPreviousPage } from '@typepurify/paginate';

const hasNext = calculateHasNextPage(currentPage, totalPages);
const hasPrev = calculateHasPreviousPage(currentPage);
```

## 🆕 New in v0.5.8

### `collectPaginatedChunks(map, activePage)` — Memory-Safe Chunk GC

Garbage-collects inactive paginated chunks from a Map store, retaining only the active page.

```typescript
import { collectPaginatedChunks } from "@typepurify/paginate";

const chunks = new Map([[0, [...]], [1, [...]], [2, [...]]]);
collectPaginatedChunks(chunks, 1); // removes pages 0 and 2
```

### `calculateVirtualListItems(total, pageSize, page)` — Virtual List Offsets

Computes slice start/end offsets for virtualized list rendering.

```typescript
import { calculateVirtualListItems } from '@typepurify/paginate';

const { start, end } = calculateVirtualListItems(100, 10, 2);
// => { start: 20, end: 30 }
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`parseRelayConnection(connection)`** — Extracts a flat node array from a GraphQL Relay connection object. Companion to the existing `buildConnection` helper.

```typescript
import { buildConnection, parseRelayConnection } from '@typepurify/paginate';

const conn = buildConnection([
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]);
const nodes = parseRelayConnection(conn);
// => [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]
```

**Bug Fixes:**

- Added `mergePaginatedPages` helper for deduplicating overlapping items across infinite scroll pages.

### v0.5.1

- Added `calculateHasPreviousPage` and `calculateHasNextPage` utilities.

## 0.5.8 Updates

Includes new features.
