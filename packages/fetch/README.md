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

## 📄 License

MIT © [Vallarasu Kanthasamy](https://github.com/vallarasuk)
