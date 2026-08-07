<div align="center">
  <h1>✨ typepurify</h1>
  <p>The ultimate zero-schema JSON cleaner for TypeScript. Recursively remove null, undefined, and empty objects while preserving exact type inference. No Zod or Yup needed.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/typepurify.svg?style=flat-square)](https://www.npmjs.com/package/typepurify)
[![npm downloads](https://img.shields.io/npm/dw/typepurify.svg?style=flat-square)](https://www.npmjs.com/package/typepurify)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/vallarasuk/typepurify/actions/workflows/ci.yml/badge.svg)](https://github.com/vallarasuk/typepurify/actions)

<div align="center">
  <a href="https://typepurify.vallarasuk.com" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Preview_&_Documentation-Click_Here-blue?style=for-the-badge" alt="Live Preview" />
  </a>
  <p><em>Try out our Interactive Web IDE! You can edit raw JSON payloads and instantly toggle options like <code>cleanParse() Mode</code> directly in your browser.</em></p>
</div>

## 🚀 Overview

`typepurify` is the core engine of the **TypePurify Ecosystem**. It is a lightning-fast, zero-schema data cleaner designed to deeply strip `null`, `undefined`, and optionally empty strings, arrays, or objects from your data maps while keeping your TypeScript types perfectly aligned.

Instead of writing complex Zod or Joi schemas just to clean a payload, `typepurify` automatically re-infers your types at compile-time and safely handles nested structures natively.

> 🌟 **Ecosystem Expansion:** We are actively expanding! Check out our new packages like **[`@typepurify/fetch`](https://www.npmjs.com/package/@typepurify/fetch)** for a safe, auto-purifying wrapper around the native `fetch` API!

---

## 📦 Installation

Clean, copy-pasteable installation for your favorite package manager:

```bash
npm install typepurify
```

```bash
yarn add typepurify
```

```bash
pnpm add typepurify
```

---

## 🛠 Supported Data Types

`typepurify` intelligently traverses your data while respecting language primitives.

**✅ Deeply Purified:**

- `Object` (Nested keys are recursively checked)
- `Array` (Nullish elements are removed, holes are collapsed)
- `Map` (Keys & values are deep-cleaned)
- `Set` (Nullish values are dropped)

**🛡️ Safely Ignored (Preserved as-is):**

- `Date`, `RegExp`, `Error`
- `Promise`
- `ArrayBuffer`, `SharedArrayBuffer`, `TypedArray` (e.g., `Uint8Array`)
- `WeakMap`, `WeakSet`, `Function`

---

## 💻 Usage & Visual Examples

### 1. Standard Cleaning (Input vs Output)

Instantly clean up `null` and `undefined` properties from a messy API response.

```typescript
import { clean } from 'typepurify';

// ❌ Dirty Input Data
const messyPayload = {
  id: 101,
  profile: {
    title: null,
    geo: 'IN',
  },
  tags: ['React', null, 'TypeScript'],
};

// 🧹 Run TypePurify
const pristinePayload = clean(messyPayload);

// ✨ Purified Output
/*
{ 
  id: 101, 
  profile: { 
    geo: 'IN' 
  }, 
  tags: ['React', 'TypeScript']
} 
*/
```

_(💡 Notice: TypeScript automatically updates the type of `pristinePayload` to remove `null` from `profile.title` and `tags`!)_

### 2. Aggressive Cleaning (Stripping Empty Values)

Need to remove empty strings, arrays, and objects? Use the `options` configuration.

```typescript
import { clean } from 'typepurify';

// ❌ Dirty Input Data
const messyPayload = {
  id: 102,
  description: '',
  metadata: {},
  hobbies: [],
  valid: true,
};

// 🧹 Run TypePurify with Options
const ultraCleanPayload = clean(messyPayload, {
  stripEmptyStrings: true,
  stripEmptyArrays: true,
  stripEmptyObjects: true,
});

// ✨ Purified Output
/*
{ 
  id: 102,
  valid: true
} 
*/
```

### 3. High-Performance JSON Parsing (`cleanParse`) (v1.4.0 🚀)

For maximum performance when fetching data from an API, skip `JSON.parse()` entirely and use `cleanParse`. This parses the raw JSON string and deep-cleans it in a **single pass**, completely eliminating the memory overhead of intermediate objects.

```typescript
import { cleanParse } from 'typepurify';

// ❌ Raw Dirty JSON String from API
const rawJson = '{"id": 103, "name": "   Jane Doe   ", "emptyList": [], "nullProp": null}';

// 🧹 Parse and Clean in one pass (Up to 25% faster)
const pristinePayload = cleanParse(rawJson, {
  stripEmptyArrays: true,
  trimStrings: true,
});

// ✨ Purified Output
/*
{ 
  id: 103,
  name: "Jane Doe"
} 
*/
```

---

## ⚡ API Reference

### `clean<T>(obj: T, options?: CleanOptions): DeepRequired<T>`

Recursively deep-cleans null/undefined values from objects and arrays, dynamically re-inferring compile-time types without generating heavy schemas.

### `deepOmit<T, K>(obj: T, keys: K[] | Set<K>)` & `deepPick<T, K>(obj: T, keys: K[] | Set<K>)`

Highly optimized $O(1)$ constant-time utilities that deep-traverse your payload to instantly remove (`deepOmit`) or selectively extract (`deepPick`) specific keys at any nesting level. Using a `Set` makes this vastly more performant than lodash on large payloads!

### `cleanInPlace<T>(obj: T, options?: CleanOptions): DeepRequired<T>`

Operates exactly like `clean()`, but **mutates the original payload directly** instead of allocating new objects in memory. Offers maximum performance and zero memory overhead for massive payloads.

### `cleanAsync<T>` & `cleanInPlaceAsync<T>`

Asynchronous versions of the above that yield to the event loop every 1,000 iterations to prevent blocking the main thread when processing gigantic API payloads.

### `cleanParse<T>(json: string, options?: CleanOptions): DeepRequired<T>` (v1.4.0 🚀)

A specialized JSON parser that deeply cleans a raw JSON string in a single pass. By skipping standard `JSON.parse` and its intermediate object allocation, `cleanParse` is incredibly memory-efficient and up to 25% faster for massive JSON payloads.

### `MemoryBuffer<T>(capacity?: number)` (v1.6.3 🚀)

An optimized in-memory chunk buffer for streaming data purification operations with customizable capacity boundaries and `.flush()`, `.push()`, `.size()` methods.

### Options Configuration (`CleanOptions`)

- `stripEmptyStrings`: Removes `""`
- `stripEmptyArrays`: Removes `[]`
- `stripEmptyObjects`: Removes `{}`
- `trimStrings`: Trims whitespace from strings before processing
- `stripWhen`: Custom predicate function (e.g. `(val) => val === 'N/A'`)
- `transform`: Custom callback to mutate values before they are processed

---

## ⚡ Why `typepurify`? (vs. Zod / Lodash)

| Feature                  | `typepurify`                 | Zod / Joi                | Lodash                 |
| :----------------------- | :--------------------------- | :----------------------- | :--------------------- |
| **Package Size**         | **< 1 kB** ⚡                | ~550 kB 🐢               | ~1.4 MB 🐌             |
| **TypeScript Inference** | **Perfect (Automatic)**      | Requires Manual Schemas  | Destroys Types (`any`) |
| **Boilerplate Code**     | **Zero (1 Line)**            | High (Hundreds of lines) | Medium                 |
| **Execution Speed**      | **Extreme** (`cleanInPlace`) | Slow (Schema parsing)    | Fast                   |

---

## 🆕 New in v1.6.8

### `inferSchemaBatch(objects)` — Batch Schema Inferencer

Runs `inferSchema` across an array of objects in a single call, returning an array of schema maps.

```typescript
import { inferSchemaBatch } from 'typepurify';

const schemas = inferSchemaBatch([
  { id: 1, name: 'Alice' },
  { id: 2, active: true, tags: ['ts'] },
]);
// => [{ id: 'number', name: 'string' }, { id: 'number', active: 'boolean', tags: 'array' }]
```

### `createWasmBindingsAdapter(wasmModule)` — WASM Bindings Adapter

Wraps a WebAssembly module exports object as a typed JavaScript facade.

```typescript
import { createWasmBindingsAdapter } from 'typepurify';

const wasmModule = await WebAssembly.instantiate(buffer);
const adapter = createWasmBindingsAdapter(wasmModule.exports);
const result = adapter.call('add', 1, 2);
```

---

## Contributing

Contributions, issues, and feature requests are welcome! See our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 👨💻 About the Author

**Vallarasu Kanthasamy**  
_Full-Stack & Systems Engineer_

I build lightweight, high-performance developer utilities and media automation engines. My engineering focus centers on zero-dependency architecture, defensive data structures, and advanced TypeScript type systems that normalize boundaries in enterprise applications.

### 🌐 Digital Ecosystem & Platforms

**Developer Tools & Extensions**

- [Auto Console Log (VS Code)](https://marketplace.visualstudio.com/items?itemName=VallarasuKanthasamy.auto-console-log-by-vallarasu-kanthasamy) – Lightning-fast debugging for JS/TS.
- [Opacity Adjuster (Chrome Extension)](https://chromewebstore.google.com/detail/opacity-adjuster-by-valla/elgajofcbjicopepiodbabodkajnihog?pli=1)
- [Tech Stack Checker (Chrome Extension)](https://chromewebstore.google.com/detail/tech-stack-checker/lhcplmfhkmjobfnndaabeddibhimghgf)
- [Universal Spreadsheet Markdown Editor](https://open-vsx.org/extension/VallarasuKanthasamy/universal-spreadsheet-markdown-editor)
- [Media Bucket Sync for Amazon S3 (WordPress)](https://wordpress.org/plugins/vallarasu-media-bucket-sync-amazon-s3/)

**Open Source & Resources**

- [Awesome Developer Resources](https://github.com/vallarasuk/awesome-developer-resources) – A curated list of high-value tools for developers.
- [My Developer Resources & Blog](https://vallarasuk.com/resources)

**Connect With Me**

- **Portfolio:** [vallarasuk.com](https://vallarasuk.com)
- **GitHub:** [github.vallarasuk.com](https://github.com/vallarasuk)
- **LinkedIn:** [linkedin.vallarasuk.com](https://linkedin.com/in/vallarasuk)
- **Community:** [Join my WhatsApp Developer Squad](http://squad.vallarasuk.com/)

---

## 🛡️ License

MIT © [Vallarasu Kanthasamy](https://github.com/vallarasuk)

---

## 📋 Changelog

### v1.6.4 — Latest

**New Features:**

- **`traverseObjectGraph(obj, visitor)`** — Recursively walks every node of an object graph, safely detecting and skipping circular references and prototype-polluting keys (`__proto__`, `constructor`, `prototype`).

```typescript
import { traverseObjectGraph } from 'typepurify';

const graph = { a: { b: { c: 42 } } };
const visited: string[] = [];

traverseObjectGraph(graph, (value, path) => {
  if (path.length > 0) visited.push(path.join('.'));
});
// visited => ['a', 'a.b', 'a.b.c']
```

**Bug Fixes:**

- Fixed `transform` callback TypeScript inference — parameters are now explicitly typed as `(val: any, key: any)` to prevent `TS7006` implicit-any errors in strict mode projects.
- Fixed `deepOmit` return type access on omitted keys requiring an explicit `as any` cast to satisfy strict TypeScript.

---

### v1.2.0

- Added `traverseObjectGraph` for safe, circular-reference-aware graph traversal.

### v1.0.1

- Added `pruneExcess` to strip excess properties beyond a defined schema shape.
- Added `preventMemoryLeaks` to proactively clear WeakRef/WeakMap collections.

### v0.4.6

- Added `deepMerge(target, source)` to deeply merge objects and deduplicate arrays, and `isPlainObject(val)` for reliable type checking.
