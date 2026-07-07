# 🚀 typepurify Roadmap & Future Vision

Welcome to the `typepurify` roadmap! First off, a huge thank you to the community—we reached **1,000+ downloads within the first 24 hours** purely organically!

This document outlines our current state, where we are heading, and how other developers can understand our versioning and contribute to the vision.

## 📍 Current State

**Current Version:** `v1.1.4`

- **Features:** Deep cleaning for Objects and Arrays natively.
- **TypeScript:** Perfectly infers types and removes `null`/`undefined` at compile time via `DeepRequired`.
- **Options:** `stripEmptyStrings`, `stripEmptyArrays`, `stripEmptyObjects`, `trimStrings`, `stripWhen`.

---

## 📅 Upcoming Milestones (From v1.1.4 onwards)

### 🛠️ Version 1.1.5 (Next Patch Release)

_Focus: Minor optimizations and developer experience improvements._

- **JSDoc Enhancements:** Improve inline documentation and IDE hover support for `clean` and `cleanInPlace`.
- **Edge Case Tests:** Add comprehensive tests for highly nested circular references and complex prototype chains.

### 🚀 Version 1.2.0 (The Data Structures Update)

_Focus: Expanding runtime support for complex JavaScript objects._

- **Runtime `Map` and `Set` Support:** While our TypeScript `DeepRequired` type already understands `Map` and `Set`, the runtime `clean()` function needs to iterate over and clean these structures deeply just like Arrays and Objects.
- **`transform()` Callback:** Alongside the existing `stripWhen` predicate, introduce a `transform(val, key)` option to allow developers to format or mutate values on the fly (e.g., date string parsing, string-to-number coercion).
- **Official Benchmarks:** Publish a public benchmark suite comparing `typepurify`'s speed and memory footprint against Lodash (`omitBy`) and Zod.

### 🧠 Version 1.3.0 (The Advanced Inference Update)

_Focus: Pushing the boundaries of TypeScript's type system._

- **Strict Mode Inference:** Provide a stricter version of `DeepRequired`. If a developer passes `{ stripEmptyStrings: true }`, the type engine will physically remove `""` (empty string literals) from the TypeScript unions of the returned object.
- **Asynchronous Cleaning (`cleanAsync`):** A non-blocking version using `setImmediate` or microtasks to traverse massive data payloads without freezing the Node.js event loop.

### 🌟 Version 2.0.0 (The Performance Era)

_Focus: Complete architectural overhaul for extreme scale._

- **Rust / WASM Core:** Explore writing the recursive traversal engine in Rust/WebAssembly for near-native execution speed when cleaning multi-megabyte API responses.
- **JSON String Cleaning (`cleanParse`):** A utility to parse and clean raw JSON strings in a single pass, bypassing standard `JSON.parse` intermediate object allocation entirely to save massive amounts of RAM.

---

## 🤝 How to Contribute

We're actively looking for developers to help shape the future of payload normalization! If you are interested in any of the roadmap items (especially the upcoming **v1.2.0 Map/Set runtime support**):

1. Check the [Issues](https://github.com/vallarasuk/typepurify/issues) tab.
2. Join the discussion on architectural decisions.
3. Submit a PR! (Please ensure all `vitest` unit tests and TypeScript inference checks pass).

Let's make `typepurify` the absolute standard for BFF (Backend-for-Frontend) and API response cleaning in the TypeScript ecosystem.
