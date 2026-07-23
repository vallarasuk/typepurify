# @typepurify/cache

A fast, lightweight, in-memory TTL caching wrapper for promises. Part of the TypePurify ecosystem.

## Installation

```bash
npm install @typepurify/cache
```

## Usage

When you wrap an asynchronous function with `withCache`, its returned values are cached based on the arguments provided. If you call it again with the same arguments before the Time-To-Live (TTL) expires, it returns the cached result immediately.

```typescript
import { withCache } from '@typepurify/cache';

const fetchUserData = async (userId: number) => {
  console.log('Fetching from API...');
  const res = await fetch(`https://api.example.com/users/${userId}`);
  return res.json();
};

// Cache responses for 5 minutes (300,000 ms)
const cachedFetch = withCache(fetchUserData, { ttl: 300000 });

// First call: fetches from API
const user = await cachedFetch(123);

// Second call: returns instantly from cache
const sameUser = await cachedFetch(123);
```

### Custom Cache Keys

By default, `withCache` uses `JSON.stringify(args)` to determine if a call matches a cached entry. You can override this using a custom `keyGenerator`.

```typescript
const cachedFetch = withCache(fetchUserData, {
  ttl: 60000,
  keyGenerator: (userId) => `user_${userId}`,
});
```
