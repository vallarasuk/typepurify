<div align="center">
  <h1>✨ @typepurify/cache</h1>
  <p>High-performance in-memory cache with TTL and LRU eviction policies.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/cache.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/cache)

## 🚀 Overview

`@typepurify/cache` is a lightweight, zero-dependency caching mechanism designed for REST APIs and expensive computational functions. It supports exact TTL (Time To Live), manual invalidation, and maximum capacity (LRU).

## 📦 Installation

```bash
npm install @typepurify/cache
```

## 🛠 Features & Examples

### 1. `MemoryCache`

```typescript
import { MemoryCache } from '@typepurify/cache';

// Create a cache with a max size of 1000 items and a global TTL of 60 seconds
const cache = new MemoryCache<string>({
  maxSize: 1000,
  ttl: 60000,
});

// Set data
cache.set('user:123', 'Alice');

// Retrieve data
const user = cache.get('user:123'); // "Alice"

// Check if data exists
if (cache.has('user:123')) {
  // ...
}

// Delete specific key
cache.delete('user:123');

// Clear entire cache
cache.clear();
```

### 2. Override TTL on `set`

You can override the global TTL for specific, highly volatile items.

```typescript
// Expires in 5 seconds instead of the global TTL
cache.set('crypto:price', '$42,000', { ttl: 5000 });
```

### 3. Check for Keys Without Mutating

Use the `has` method to verify if a key exists without mutating the LRU access order.

```typescript
if (cache.has('my-key')) {
  // Key exists and is valid
}
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
