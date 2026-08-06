<div align="center">
  <h1>✨ TypePurify Ecosystem</h1>
  <p>Enterprise-grade, zero-schema data purification and type-safe utilities for TypeScript and React.</p>

<a href="https://www.npmjs.com/package/typepurify"><img src="https://img.shields.io/npm/v/typepurify?color=blue&label=Core%20Engine&style=flat-square" alt="typepurify npm"></a>
<a href="https://www.npmjs.com/package/@typepurify/fetch"><img src="https://img.shields.io/npm/v/@typepurify/fetch?color=blue&label=Fetch%20Wrapper&style=flat-square" alt="@typepurify/fetch npm"></a>
<img src="https://img.shields.io/npm/dt/typepurify?color=success&style=flat-square" alt="Downloads">
<img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript Strict">
<img src="https://img.shields.io/badge/Dependencies-0-success?style=flat-square" alt="Zero Dependencies">
</div>

---

## 🚀 Welcome to the Monorepo

**TypePurify** is a lightning-fast, zero-dependency ecosystem designed to deeply clean your data structures while strictly maintaining TypeScript type safety. No Zod. No Yup. Just pure, clean data.

### 📦 Available Packages

| Package                                               | Version                                                                                                                   | Description                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **[`typepurify`](packages/core)**                     | [![npm](https://img.shields.io/npm/v/typepurify.svg)](https://www.npmjs.com/package/typepurify)                           | The core engine. Deeply cleans `null`, `undefined`, and empty structures while strictly maintaining TypeScript types.  |
| **[`@typepurify/fetch`](packages/fetch)**             | [![npm](https://img.shields.io/npm/v/@typepurify/fetch.svg)](https://www.npmjs.com/package/@typepurify/fetch)             | A lightweight safe `fetch` wrapper that auto-parses and purifies JSON API responses.                                   |
| **[`@typepurify/react-state`](packages/react-state)** | [![npm](https://img.shields.io/npm/v/@typepurify/react-state.svg)](https://www.npmjs.com/package/@typepurify/react-state) | Tiny alternative React hooks (like `usePurifiedState`) for form, loading, and query state that automatically sanitize. |
| **[`@typepurify/react-table`](packages/react-table)** | [![npm](https://img.shields.io/npm/v/@typepurify/react-table.svg)](https://www.npmjs.com/package/@typepurify/react-table) | Universal, zero-dependency Data Table utilities.                                                                       |
| **[`@typepurify/dedupe`](packages/dedupe)**           | [![npm](https://img.shields.io/npm/v/@typepurify/dedupe.svg)](https://www.npmjs.com/package/@typepurify/dedupe)           | Highly optimized async request deduplicator to prevent redundant API calls and state thrashing.                        |
| **[`@typepurify/security`](packages/security)**       | [![npm](https://img.shields.io/npm/v/@typepurify/security.svg)](https://www.npmjs.com/package/@typepurify/security)       | Security inspection tools, including memory-efficient secret detection and JWT inspection.                             |
| **[`@typepurify/llm`](packages/llm)**                 | [![npm](https://img.shields.io/npm/v/@typepurify/llm.svg)](https://www.npmjs.com/package/@typepurify/llm)                 | AI response utilities, ReDoS-safe JSON extraction from LLM outputs, stream parsing, and prompt management.             |
| **[`@typepurify/cache`](packages/cache)**             | [![npm](https://img.shields.io/npm/v/@typepurify/cache.svg)](https://www.npmjs.com/package/@typepurify/cache)             | Simple in-memory REST API cache.                                                                                       |
| **[`@typepurify/retry`](packages/retry)**             | [![npm](https://img.shields.io/npm/v/@typepurify/retry.svg)](https://www.npmjs.com/package/@typepurify/retry)             | Standalone retry utility for async functions.                                                                          |
| **[`@typepurify/paginate`](packages/paginate)**       | [![npm](https://img.shields.io/npm/v/@typepurify/paginate.svg)](https://www.npmjs.com/package/@typepurify/paginate)       | Smart pagination utilities.                                                                                            |
| **[`@typepurify/json`](packages/json)**               | [![npm](https://img.shields.io/npm/v/@typepurify/json.svg)](https://www.npmjs.com/package/@typepurify/json)               | Advanced JSON manipulation.                                                                                            |
| **[`@typepurify/logger`](packages/logger)**           | [![npm](https://img.shields.io/npm/v/@typepurify/logger.svg)](https://www.npmjs.com/package/@typepurify/logger)           | Enterprise logging suite.                                                                                              |
| **[`@typepurify/types`](packages/types)**             | [![npm](https://img.shields.io/npm/v/@typepurify/types.svg)](https://www.npmjs.com/package/@typepurify/types)             | Advanced TypeScript utility types and helpers.                                                                         |
| **[`@typepurify/cli`](packages/cli)**                 | [![npm](https://img.shields.io/npm/v/@typepurify/cli.svg)](https://www.npmjs.com/package/@typepurify/cli)                 | Scaffolding and analysis CLI.                                                                                          |

---

## ⚡ Quick Start

You can install packages individually or grab the full stack for your applications:

```bash
npm install typepurify @typepurify/fetch
```

### The Magic of TypePurify

Clean your complex backend data perfectly without losing your types:

```typescript
import { clean } from 'typepurify';
import { tFetch } from '@typepurify/fetch';

// 1. Core Data Purification (Removes null, undefined, empty objects, empty arrays)
const dirtyData = { name: 'Alice', age: null, metadata: {}, tags: [] };
const cleanData = clean(dirtyData);
// => { name: "Alice" } (TypeScript strictly knows this is just { name: string })

// 2. Deep Omit & Pick (O(1) Time Complexity)
import { deepOmit, deepPick } from 'typepurify';
const massivePayload = { id: 1, secret: 'xoxb-123', nested: { secret: 'xoxb-456', data: 'ok' } };
const safePayload = deepOmit(massivePayload, ['secret']); // Strips 'secret' at any depth!

// 3. Safe API Fetching with Global Interceptors
const myFetch = createTFetch({
  baseUrl: 'https://api.example.com',
  interceptors: {
    onRequest: (req) => {
      req.init = { ...req.init, headers: { Auth: 'Bearer 123' } };
      return req;
    },
  },
});
const user = await myFetch<{ name: string; age: number | null }>('/user');

// Response automatically drops all the `null` and empty junk your backend sends!

// 4. React State Purification
import { usePurifiedState, useToggle } from '@typepurify/react-state';
function MyComponent() {
  // State is automatically cleaned on mount and on every setState!
  const [state, setState] = usePurifiedState({ name: 'Bob', empty: null });

  // Easily toggle boolean states
  const [isOpen, toggleOpen] = useToggle();
}
```

---

## ✨ Recent Feature Additions (v1.6.6 / v0.5.6)

We are constantly expanding the ecosystem. Here are the latest capabilities added across all packages in the **v0.5.6** (Core **v1.6.6**) release:

---

### 🔁 `typepurify` (core) — `v1.6.6`

**`sanitizeObject`**, **`crawlArray`**, **`inferSchema`** — Deep recursive string sanitization, high-throughput array crawling, and runtime payload schema inference.

```typescript
import { sanitizeObject, crawlArray, inferSchema } from 'typepurify';

// 1. Sanitize nested string values
const clean = sanitizeObject({ name: '  ALICE ' }, (s) => s.trim().toLowerCase());

// 2. High-throughput array crawling
const crawled = crawlArray([1, null, 3], (val) => (val ? val * 2 : undefined));

// 3. Runtime schema inference
const schema = inferSchema({ name: 'Alice', age: 30 });
```

---

### 💾 `@typepurify/cache` — `v0.5.6`

**`LocalStorageAdapter`**, **`mget`**, **`mset`** — Web Storage persistent caching adapter and bulk key operations.

```typescript
import { LocalStorageAdapter, Cache } from '@typepurify/cache';

const ls = new LocalStorageAdapter('my_app_');
ls.setItem('user', { name: 'Alice' });

const cache = new Cache<number>();
cache.mset([
  ['a', 1],
  ['b', 2],
]);
const values = cache.mget(['a', 'b']);
```

---

### 🧩 `@typepurify/dedupe` — `v0.5.6`

**`DedupePromisePool`** — Deduplicate concurrent promise executions across a shared key pool.

```typescript
import { DedupePromisePool } from '@typepurify/dedupe';

const pool = new DedupePromisePool<string, Response>();
const res = await pool.run('user-1', () => fetch('/api/user/1'));
```

---

### 🧠 `@typepurify/types` — `v0.5.6`

**`AsyncReturnType`**, **`ValueOf`** — Extract unwrapped async return types and object property value unions.

```typescript
import type { AsyncReturnType, ValueOf } from '@typepurify/types';

type UserFn = () => Promise<{ id: string }>;
type User = AsyncReturnType<UserFn>; // => { id: string }
type UserProps = ValueOf<User>; // => string
```

---

### 🔒 `@typepurify/security` — `v0.5.6`

**`isSqlInjectionAttempt`** — Heuristic SQL Injection scanner for untrusted input strings.

```typescript
import { isSqlInjectionAttempt } from '@typepurify/security';

if (isSqlInjectionAttempt("SELECT * FROM users WHERE '1'='1'")) {
  throw new Error('Malicious payload detected');
}
```

---

### ⚡ `@typepurify/react-state` — `v0.5.6`

**`useAsyncEffect`**, **`useCopyToClipboard`** — React hooks for cancellable async effects and clipboard interactions.

```typescript
import { useAsyncEffect, useCopyToClipboard } from '@typepurify/react-state';

useAsyncEffect(async (isCancelled) => {
  const data = await fetchData();
  if (!isCancelled()) setState(data);
}, []);

const [isCopied, copy] = useCopyToClipboard();
```

---

### 🗂️ `@typepurify/react-table` — `v0.5.6`

**`exportToJson`** — Client-side JSON file exporter helper in `useTable`.

---

### 🤖 `@typepurify/llm` — `v0.5.6`

**`formatToolCall`**, **`createSystemMessage`** — Standardized tool call JSON formatting and system prompt wrappers.

---

### 📋 `@typepurify/logger` — `v0.5.6`

**`createBufferedLogger`** — In-memory log buffer inspector and flusher.

---

### 🛠️ `@typepurify/cli` — `v0.5.6`

**`generateChangelogFromCommits`** — Scaffolding changelog generator from commit messages.

---

### 🌐 `@typepurify/fetch` — `v0.5.6`

**`createMockFetchAdapter`** — Offline mock response fetch handler for unit testing.

---

### 📄 `@typepurify/paginate` — `v0.5.6`

**`filterPaginatedItems`** — Dynamic filtering and paginated slice recalculation.

---

### 📦 `@typepurify/json` — `v0.5.6`

**`flattenJson`** — Flatten nested object structures into single-level dot-notation key paths.

---

### 🔄 `@typepurify/retry` — `v0.5.6`

**`executeWithRetryBudget`** — Prevent cascading retry storms using max retry budget ratio controls.

---

---

### 🌐 `@typepurify/fetch` — `v0.5.4`

**`createRateLimiterFetch`** — Throttle outgoing HTTP requests to a maximum per-second rate.

```typescript
import { createRateLimiterFetch } from '@typepurify/fetch';

const rateFetch = createRateLimiterFetch(5); // max 5 requests/sec
await rateFetch('https://api.example.com/data');
```

---

### 🔄 `@typepurify/retry` — `v0.5.4`

**`RetryEventEmitter`** — Subscribe to retry lifecycle events: `attempt`, `success`, `failure`, `exhaust`.

```typescript
import { RetryEventEmitter } from '@typepurify/retry';

const emitter = new RetryEventEmitter();

const unsubscribe = emitter.on('attempt', (data) => {
  console.log('Retry attempt:', data);
});

emitter.emit('attempt', { count: 1 });
unsubscribe(); // cleanup listener
```

---

### 🧩 `@typepurify/dedupe` — `v0.5.4`

**`parseGraphQLQueryKey`** — Normalize GraphQL queries into stable deduplication cache keys.

```typescript
import { parseGraphQLQueryKey, dedupeAsync } from '@typepurify/dedupe';

const key = parseGraphQLQueryKey('query getUser { user { id } }', { id: 1 });
// => "gql:query getUser { user { id } }:{"id":1}"

// Use as key in dedupeAsync for request deduplication
```

---

### 📄 `@typepurify/paginate` — `v0.5.4`

**`parseRelayConnection`** — Extract a flat node array from a GraphQL Relay connection object.

```typescript
import { buildConnection, parseRelayConnection } from '@typepurify/paginate';

const connection = buildConnection([
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]);
const nodes = parseRelayConnection(connection);
// => [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]
```

---

### 💾 `@typepurify/cache` — `v0.5.4`

**`FileSystemStorageAdapter`** — Pluggable async storage adapter for persistent cache backends.

```typescript
import { FileSystemStorageAdapter } from '@typepurify/cache';

const fsCache = new FileSystemStorageAdapter('/path/to/cache');
await fsCache.setItem('user:123', { name: 'Alice' });
const user = await fsCache.getItem('user:123');
// => { name: 'Alice' }
```

---

### 🧠 `@typepurify/types` — `v0.5.4`

**`RegexMatchLiteral`** — Type-level regex match extraction yielding a string union of matches.

```typescript
import type { RegexMatchLiteral } from '@typepurify/types';

type Matches = RegexMatchLiteral<'hello_world_test', 'world'>;
// => 'world'
```

---

### 🗂️ `@typepurify/react-table` — `v0.5.4`

**`createHeadlessTableCore`** — Compute headless table metadata (column keys, item count, empty state) without any styling.

```typescript
import { createHeadlessTableCore } from '@typepurify/react-table';

const core = createHeadlessTableCore(
  [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  [{ key: 'id' }, { key: 'name' }],
);

console.log(core.itemCount); // 2
console.log(core.columnKeys); // ['id', 'name']
console.log(core.isEmpty); // false
```

---

### ⚡ `@typepurify/react-state` — `v0.5.4`

**`createLeaderElectionNode`** — Multi-tab leader election node for browser tab synchronization.

```typescript
import { createLeaderElectionNode } from '@typepurify/react-state';

const node = createLeaderElectionNode('my-app-leader');
node.claimLeader(); // this tab becomes leader
console.log(node.isLeader()); // true
node.releaseLeader(); // release leadership
```

---

### 🤖 `@typepurify/llm` — `v0.5.4`

**`createRagPipelineSummary`** — Summarize relevant document context for LLM RAG retrieval pipelines.

```typescript
import { createRagPipelineSummary } from '@typepurify/llm';

const docs = [
  'TypeScript is a typed superset of JavaScript.',
  'Python is a dynamically typed language.',
  'TypeScript compiles to plain JavaScript.',
];

const summary = createRagPipelineSummary(docs, 'TypeScript');
// => "TypeScript is a typed superset of JavaScript.\n---\nTypeScript compiles to plain JavaScript."
```

---

### 📋 `@typepurify/logger` — `v0.5.4`

**`injectOpenTelemetryTraceHeader`** — Inject W3C `traceparent` headers for distributed tracing.

```typescript
import { injectOpenTelemetryTraceHeader } from '@typepurify/logger';

const headers = injectOpenTelemetryTraceHeader(
  '4bf92f3577b34da6a3ce929d0e0e4736',
  '00f067aa0ba902b7',
);
// => { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }

fetch('/api/endpoint', { headers });
```

---

### 🔒 `@typepurify/security` — `v0.5.4`

**`SlidingWindowSecurityRateLimiter`** — Sliding window rate limiter to block brute-force and IP spoofing.

```typescript
import { SlidingWindowSecurityRateLimiter } from '@typepurify/security';

const limiter = new SlidingWindowSecurityRateLimiter(100, 60000); // 100 req / 60s
if (!limiter.isAllowed()) {
  throw new Error('Rate limit exceeded');
}
```

---

### 🛠️ `@typepurify/cli` — `v0.5.4`

**`runCodemodEngine`** — Apply string and regex transforms to source code files programmatically.

```typescript
import { runCodemodEngine } from '@typepurify/cli';

const result = runCodemodEngine('var x = 1; var y = 2;', [{ from: /var/g, to: 'const' }]);
// => "const x = 1; const y = 2;"
```

---

### 📦 `@typepurify/json` — `v0.5.4`

**`parseJsonStreamChunk`** — Memory-efficient generator that streams items from a JSON array string.

```typescript
import { parseJsonStreamChunk } from '@typepurify/json';

const stream = '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]';

for (const item of parseJsonStreamChunk(stream)) {
  console.log(item); // { id: 1, name: 'Alice' }, then { id: 2, name: 'Bob' }
}
```

---

### Previous Feature Additions

- **`@typepurify/react-state`**: Added `useToggle` hook for simple boolean state management.
- **`@typepurify/react-table`**: Added `toggleAllColumnVisibility` for bulk column toggling.
- **`@typepurify/paginate`**: Added `calculateHasPreviousPage` and `calculateHasNextPage` utilities.
- **`@typepurify/cli`**: Added rich text formatting with `formatError` and `formatSuccess`.
- **`@typepurify/logger`**: Added `silent` mode configuration for quiet test environments.
- **`@typepurify/json`**: Added `isJsonString` utility for safe, pre-parse string validation.
- **`@typepurify/fetch`**: Added `buildQueryString` for elegant query parameter construction.
- **`@typepurify/dedupe`**: Added support for custom LRU cache implementations via the `cache` option.
- **`@typepurify/cache`**: Added `has(key)` method for non-mutating cache checks.
- **`@typepurify/llm`**: Added `extractFirstMarkdownBlock` to easily pull code/JSON from AI responses.
- **`@typepurify/security`**: Added `generateRandomString` for cryptographically secure tokens.
- **`@typepurify/retry`**: Introduced `RetryExhaustedError` for cleaner backoff error handling.

---

## 🗺️ What's Next?

We are building an absolute massive ecosystem! Check out our highly-structured **[ROADMAP.md](./ROADMAP.md)** to see the 50+ packages we are actively developing for APIs, React, AI, Security, and more!

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to set up this Turborepo locally and submit pull requests.

## 👨‍💻 About the Author

**Vallarasu Kanthasamy**  
_Full-Stack & Systems Engineer_

I build lightweight, high-performance developer utilities and media automation engines. My engineering focus centers on zero-dependency architecture, defensive data structures, and advanced TypeScript type systems.

**Connect With Me**

- **Portfolio:** [vallarasuk.com](https://vallarasuk.com)
- **GitHub:** [github.com/vallarasuk](https://github.com/vallarasuk)
- **LinkedIn:** [linkedin.com/in/vallarasuk](https://linkedin.com/in/vallarasuk)
- **Community:** [Join my WhatsApp Developer Squad](http://squad.vallarasuk.com/)

---

<div align="center">
  <i>Built with ❤️ for the TypeScript Community</i>
</div>
