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

| Package                                   | Version                                                                                                       | Description                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **[`typepurify`](packages/core)**         | [![npm](https://img.shields.io/npm/v/typepurify.svg)](https://www.npmjs.com/package/typepurify)               | The core engine. Deeply cleans `null`, `undefined`, and empty structures while strictly maintaining TypeScript types. |
| **[`@typepurify/fetch`](packages/fetch)** | [![npm](https://img.shields.io/npm/v/@typepurify/fetch.svg)](https://www.npmjs.com/package/@typepurify/fetch) | A safe `fetch` wrapper that auto-parses and purifies JSON responses using the core engine.                            |

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

// 2. Safe API Fetching (Auto-cleans the response)
const user = await tFetch<{ name: string; age: number | null }>('https://api.example.com/user');
// Response automatically drops all the `null` and empty junk your backend sends!
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
