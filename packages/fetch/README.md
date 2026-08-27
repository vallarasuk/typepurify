<div align="center">
  <h1>✨ @typepurify/fetch</h1>
  <p>A type-safe, auto-purifying wrapper around the native <code>fetch</code> API.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/fetch.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 🚀 Overview

`@typepurify/fetch` provides a robust, zero-dependency `tFetch` wrapper around the native `fetch` API. It natively integrates with `typepurify` to automatically deeply clean your API JSON responses while strictly retaining TypeScript types.

## 📦 Installation

```bash
npm install @typepurify/fetch typepurify
```

## 🛠 Features & Usage

### 1. Auto-Purifying Requests

Automatically drops `null` and `undefined` properties from your API payloads.

```typescript
import { tFetch } from '@typepurify/fetch';

interface UserPayload {
  id: number;
  name: string;
  age: number | null;
}

// 1. Fetch data and automatically clean it
const user = await tFetch<UserPayload>('https://api.example.com/user');

// => { id: 1, name: "Alice" }
// 'age' is stripped because it was null!
```

### 2. Built-in Interceptors, Retries & Timeouts

`tFetch` ships with advanced networking features typically requiring bulky libraries like Axios.

```typescript
import { tFetch } from '@typepurify/fetch';

const data = await tFetch(
  'https://api.example.com/data',
  {},
  {
    timeout: 5000, // Abort after 5s
    onTimeout: (req) => console.warn('Request timed out: ', req.url), // Custom timeout handler
    retries: 3, // Auto-retry on failure
    retryDelay: 1000, // Exponential backoff delay
    interceptors: {
      onRequest: (req) => {
        req.init = { ...req.init, headers: { Authorization: 'Bearer Token' } };
        return req;
      },
      onResponse: (res) => {
        console.log(`Received status: ${res.status}`);
        return res;
      },
    },
  },
);
```

### 3. Ultra-Fast `cleanParse`

Set `useCleanParse: true` to bypass the intermediate object allocation of `JSON.parse` for up to 25% faster data fetching on massive payloads.

```typescript
const largeData = await tFetch(
  'https://api.example.com/heavy',
  {},
  {
    useCleanParse: true,
    stripEmptyArrays: true,
  },
);
```

### 4. Query Parameter Construction

Elegantly construct URL query strings from complex nested objects and arrays.

```typescript
import { buildQueryString } from '@typepurify/fetch';

const query = buildQueryString({ filters: ['active', 'verified'], limit: 10 });
// => "?filters=active,verified&limit=10"
```

### 5. HTTP/3 Transport Adapter

Throttle requests using an HTTP/3 QUIC connection pool adapter.

```typescript
import { Http3TransportAdapter } from '@typepurify/fetch';

const adapter = new Http3TransportAdapter({ maxConcurrentStreams: 50 });
const data = await adapter.fetch('https://api.example.com/data');
```

### 3. Response Caching (`createCacheFetch`)

```typescript
import { createCacheFetch } from '@typepurify/fetch';

const cachedFetch = createCacheFetch({ ttlMs: 60000 });
const data = await cachedFetch('https://api.example.com/data');
```

### 6. Rate Limiter Fetch (`createRateLimiterFetch`) — _v0.5.4_

Throttle outgoing HTTP requests to a configurable maximum rate to avoid overwhelming APIs.

```typescript
import { createRateLimiterFetch } from '@typepurify/fetch';

const rateFetch = createRateLimiterFetch(5); // max 5 requests/sec
await rateFetch('https://api.example.com/items');
```

---

## 🆕 New in v0.5.8

### `parseFetchPayload(response)` — Auto Payload Parser

Automatically detects the `content-type` header and returns parsed JSON or raw text.

```typescript
import { parseFetchPayload } from '@typepurify/fetch';

const res = await fetch('https://api.example.com/data');
const data = await parseFetchPayload(res);
// => parsed JSON object if content-type is application/json
```

### `createConnectionPoolerFetch(maxConnections)` — Connection Pooler

Limits concurrent outbound fetch calls using a semaphore queue.

```typescript
import { createConnectionPoolerFetch } from '@typepurify/fetch';

const poolFetch = createConnectionPoolerFetch(5); // max 5 concurrent
const data = await poolFetch('https://api.example.com/data');
```

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`createRateLimiterFetch(maxPerSec)`** — Wraps native fetch with a token-bucket rate limiter preventing burst overload to downstream APIs.

**Bug Fixes:**

- Added `console.error` logging inside `RequestQueue.processQueue()` catch block for socket hangup errors — previously swallowed silently, now surfaced for easier debugging.
- Abort controller connection errors no longer cause queue deadlock.

### v0.5.3

- Added `createCacheFetch` for lightweight in-memory response caching with custom TTL.

### v0.5.2

- Added `Http3TransportAdapter` for HTTP/3 QUIC connection management.
- Fixed socket hangup / connection abort errors in `RequestQueue` to prevent queue deadlock.

### v0.5.1

- Added `buildQueryString` for elegant query parameter construction.

## 📄 License

MIT © [Vallarasu Kanthasamy](https://github.com/vallarasuk)

## 0.5.8 Updates

Includes new features.
