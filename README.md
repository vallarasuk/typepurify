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
import { usePurifiedState } from '@typepurify/react-state';
function MyComponent() {
  // State is automatically cleaned on mount and on every setState!
  const [state, setState] = usePurifiedState({ name: 'Bob', empty: null });
}
```

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
