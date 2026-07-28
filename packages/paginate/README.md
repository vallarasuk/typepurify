# @typepurify/paginate

Smart pagination utilities.

## Installation

```bash
npm install @typepurify/paginate
```

## Usage

Define how to fetch a single page, and how to determine the parameters for the next page. `fetchAllPages` will automatically loop until all data is retrieved.

```typescript
import { fetchAllPages } from '@typepurify/paginate';

interface User {
  id: number;
  name: string;
}

// Example API that uses a 'page' query parameter
const fetchUsersPage = async (page: number): Promise<User[]> => {
  const res = await fetch(`https://api.example.com/users?page=${page}`);
  return res.json();
};

const allUsers = await fetchAllPages({
  initialParams: 1,
  fetchPage: fetchUsersPage,
  getNextPageParams: (lastPage, currentPage) => {
    // If the API returned a full page of 20 items, assume there's another page
    return lastPage.length === 20 ? currentPage + 1 : null;
  },
});

console.log(`Fetched ${allUsers.length} users in total!`);
```

### Safety Limits

To prevent infinite loops with misconfigured APIs, you can optionally set a maximum number of pages to fetch using `maxPages`. `fetchAllPages` also stops immediately if `fetchPage` ever returns an empty array.

## 🚀 Advanced Features

### Infinite Scroll Manager

Easily handle infinite scrolling UI state in React or Vanilla JS natively without heavy UI libraries.

```typescript
import { InfiniteScrollManager } from '@typepurify/paginate';

const manager = new InfiniteScrollManager();
manager.subscribe((state) => {
  console.log('Loading:', state.isLoading, 'Page:', state.page);
});

// Start loading the next page
if (manager.startLoad()) {
  try {
    const data = await fetchPage(manager.getState().page);
    manager.completeLoad(data.length, 20); // 20 is the page limit
  } catch (err) {
    manager.failLoad(err);
  }
}
```

### Cursor Management

Native utilities for converting values to base64 cursors and back for cursor-based pagination.

```typescript
import { createCursor, parseCursor, parseOffset } from '@typepurify/paginate';

const cursor = createCursor('item-id-123'); // => "aXRlbS1pZC0xMjM="
const original = parseCursor(cursor); // => "item-id-123"

const offset = parseOffset(2, 20); // Page 2 with 20 items per page => offset 20
```

### New in v0.4.6

- Added `calculateTotalPages(totalItems, pageSize)` utility for pagination calculation.
