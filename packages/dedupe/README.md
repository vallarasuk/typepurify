<div align="center">
  <h1>✨ @typepurify/dedupe</h1>
  <p>Highly optimized async request deduplicator to prevent redundant API calls and state thrashing.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/dedupe.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/dedupe)

## 🚀 Overview

`@typepurify/dedupe` prevents duplicate inflight network requests or expensive asynchronous operations. If multiple components request the same data simultaneously, the deduplicator ensures only **one** backend call is made, sharing the resolved promise with all callers.

## 📦 Installation

```bash
npm install @typepurify/dedupe
```

## 🛠 Features & Examples

### 1. Standalone Deduplication (`dedupeAsync`)

Wrap any asynchronous function to ensure it cannot be executed concurrently with the same arguments.

```typescript
import { dedupeAsync } from '@typepurify/dedupe';

const fetchUserProfile = dedupeAsync(async (userId: string) => {
  console.log(`Fetching user ${userId} from DB...`);
  const res = await fetch(`/api/users/${userId}`);
  return res.json();
});

// Both of these will resolve at the same time, but only ONE network request is made!
const [user1, user2] = await Promise.all([fetchUserProfile('u123'), fetchUserProfile('u123')]);
```

### 2. Global Request Deduplicator Class

If you need finer control over the deduplication cache, use the `RequestDeduplicator` class.

```typescript
import { RequestDeduplicator } from '@typepurify/dedupe';

const deduper = new RequestDeduplicator();

async function getData(query: string) {
  return deduper.execute(query, () => fetch(`/api/search?q=${query}`).then((r) => r.json()));
}

// "search-1" only hits the backend once.
getData('search-1');
getData('search-1');
```

### 3. Custom LRU Caches

Inject custom cache implementations (like LRU caches) for advanced request deduplication constraints.

```typescript
import { dedupeAsync } from '@typepurify/dedupe';
import { MemoryCache } from '@typepurify/cache';

const cache = new MemoryCache();
const fetchUser = dedupeAsync(fetchFn, { cache });
```

### 4. Single Execution Wrapper (`dedupeOnce`)

Ensures an asynchronous function executes strictly once per process lifecycle.

```typescript
import { dedupeOnce } from '@typepurify/dedupe';

const initializeApp = dedupeOnce(async () => {
  console.log('Connecting to database...');
});

await initializeApp();
await initializeApp(); // No-op, returns existing promise
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
