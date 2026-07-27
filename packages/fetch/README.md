<div align="center">
  <h1>✨ @typepurify/fetch</h1>
  <p>A lightweight wrapper around native fetch that automatically purifies API responses.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/fetch.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 🚀 Overview

`@typepurify/fetch` is part of the **TypePurify Ecosystem**. It provides a drop-in replacement for the native `fetch` API that automatically strips out `null` and `undefined` properties from JSON responses, ensuring that your frontend state stays clean and perfectly typed.

---

## 📦 Installation

```bash
npm install @typepurify/fetch typepurify
```

## 💻 Usage & Visual Examples

### Standard Fetch vs `tFetch`

Instead of manually parsing JSON and manually cleaning it, `tFetch` handles it all under the hood.

```typescript
import { tFetch } from '@typepurify/fetch';

// ✨ Calling the API
const pristineData = await tFetch('https://api.example.com/users/1');

/*
If the API returns:
{ "id": 1, "name": "Jane", "bio": null, "address": null }

tFetch automatically returns:
{ "id": 1, "name": "Jane" }
*/
```

### High-Performance Parsing Mode

If you have massive JSON payloads (megabytes in size), you can enable `useCleanParse` to bypass the native `JSON.parse` entirely. This parses and cleans the JSON string in a single memory-efficient pass!

```typescript
const pristineData = await tFetch('https://api.example.com/massive-data', undefined, {
  useCleanParse: true,
  stripEmptyArrays: true,
});
```

### `createTFetch` Factory

Need global interceptors for auth tokens or default headers across your entire app? Use the `createTFetch` factory to generate a customized `tFetch` instance!

```typescript
import { createTFetch } from '@typepurify/fetch';

export const apiFetch = createTFetch({
  baseUrl: 'https://api.myapp.com/v1',
  interceptors: {
    onRequest: (req) => {
      // Automatically add auth token to EVERY request
      req.init = {
        ...req.init,
        headers: {
          ...req.init?.headers,
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      return req;
    },
  },
});

// Usage anywhere in your app:
const user = await apiFetch('/me'); // Automatically hits baseUrl and injects token!
```

## ⚙️ Advanced Configuration (Timeouts, Retries, Interceptors)

`tFetch` supports powerful network resilience features natively, without relying on external dependencies!

```typescript
const resilientData = await tFetch('https://api.example.com/unstable', undefined, {
  // Abort the request if it takes longer than 5000ms
  timeout: 5000,

  // If the request fails, retry it up to 3 times
  retries: 3,

  // Use exponential backoff starting at 1000ms (1s, 2s, 4s)
  retryDelay: 1000,

  // Intercept requests and responses
  interceptors: {
    onRequest: async (req) => {
      // e.g. Add auth headers dynamically
      req.init = {
        ...req.init,
        headers: { ...req.init?.headers, Authorization: 'Bearer token' },
      };
      return req;
    },
    onResponse: async (res) => {
      // Inspect the raw response before it gets parsed
      console.log('Response Status:', res.status);
      return res;
    },
    onError: async (error) => {
      // Handle or report the error
      console.error('Fetch Failed:', error);
      return error;
    },
  },
});
```

### Fallbacks and Errors

- Automatically throws an Error on non-ok HTTP responses (e.g., `404`).
- If the response is not `application/json`, it elegantly falls back to returning plain text.

---

### License

MIT © [Vallarasu K](https://github.com/vallarasuk)
