<div align="center">
  <h1>✨ @typepurify/dedupe</h1>
  <p>Highly optimized async request deduplicator to prevent redundant API calls and state thrashing.</p>
</div>

**New in v0.5.14**: Added `PrometheusExporter` — exports metrics for request deduplication cache hits.

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

// Manually evict specific cache entries or clear all:
fetchUserProfile.clearDedupeCache('string:u123');
fetchUserProfile.clearDedupeCache();
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

## 🆕 New in v0.5.8

### `createRedisClusterSyncer(clusterNodes)` — Distributed Lock Syncer

Distributed deduplication lock key manager for Redis cluster environments.

```typescript
import { createRedisClusterSyncer } from '@typepurify/dedupe';

const syncer = createRedisClusterSyncer(['redis://node1:6379', 'redis://node2:6379']);
if (syncer.lock('request-abc')) {
  // safe to process
  syncer.unlock('request-abc');
}
```

### `exportPrometheusMetrics(stats)` — Prometheus Exporter

Exports Prometheus-formatted counters for total and deduplicated call counts.

```typescript
import { exportPrometheusMetrics } from '@typepurify/dedupe';

const output = exportPrometheusMetrics({ totalCalls: 1000, deduplicatedCalls: 350 });
// => Prometheus text format string
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`parseGraphQLQueryKey(query, variables?)`** — Normalizes GraphQL query strings and variables into a stable, whitespace-normalized deduplication cache key. Ideal for deduplicating identical GraphQL requests regardless of whitespace formatting.

```typescript
import { parseGraphQLQueryKey } from '@typepurify/dedupe';

const key = parseGraphQLQueryKey('query getUser { user { id } }', { id: 1 });
// => "gql:query getUser { user { id } }:{"id":1}"
```

**Bug Fixes:**

- Fixed primitive key collision by adding type tags to dedupe keys (`str:`, `num:`, `bool:`), preventing string `"1"` from colliding with number `1`.
- `clearDedupeCache` now correctly clears formatted tagged keys.

### v0.5.1

- Added custom LRU cache injection support in `dedupeAsync`.

## 0.5.8 Updates

Includes new features.
