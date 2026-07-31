<div align="center">
  <h1>✨ @typepurify/retry</h1>
  <p>Standalone, zero-dependency retry utility for async functions with exponential backoff.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/retry.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/retry)

## 🚀 Overview

`@typepurify/retry` provides robust, production-ready retry logic for unstable network requests, database transactions, and file system operations. Features exponential backoff, jitter, and custom bail conditions.

## 📦 Installation

```bash
npm install @typepurify/retry
```

## 🛠 Features & Examples

### 1. `retryAsync`

Execute an asynchronous function with built-in retry logic.

```typescript
import { retryAsync } from '@typepurify/retry';

const data = await retryAsync(
  async () => {
    const res = await fetch('https://api.flaky.com/data');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  },
  {
    retries: 3, // Max attempts
    delay: 1000, // Base delay in ms
    factor: 2, // Exponential backoff factor (1000ms, 2000ms, 4000ms)
    jitter: true, // Add randomness to prevent thundering herd
    onRetry: (e, attempt) => console.warn(`Attempt ${attempt} failed: ${e.message}`),
  },
);
```

### 2. `withRetry` Wrapper

Wrap an existing function to create a resilient version that automatically retries when invoked.

```typescript
import { withRetry } from '@typepurify/retry';

const resilientFetch = withRetry(fetch, { retries: 5, delay: 500 });

// Use just like normal fetch, but it auto-retries!
const res = await resilientFetch('https://api.flaky.com/data');
```

### 3. Precise Error Handling

Handle backoff failures elegantly using the specialized `RetryExhaustedError`.

```typescript
import { retryAsync, RetryExhaustedError } from '@typepurify/retry';

try {
  await retryAsync(fetchFn, { retries: 3 });
} catch (error) {
  if (error instanceof RetryExhaustedError) {
    console.error('All retries failed:', error.lastError);
  }
}
```

### 4. `RetryLock` Synchronization

Synchronize async task execution across retries using exclusive locks.

```typescript
import { RetryLock } from '@typepurify/retry';

const lock = new RetryLock();
const result = await lock.runExclusive(async () => {
  // Concurrently safe operation
  return 'done';
});
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
