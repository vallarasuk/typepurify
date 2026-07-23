# @typepurify/paginate

A utility to effortlessly fetch and combine all pages from a paginated API into a single array. Part of the TypePurify ecosystem.

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
