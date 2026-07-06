<div align="center">
  <h1>✨ typepurify</h1>
  <p>Deep-clean any API response while preserving precisely inferred recursive types—no schemas, no boilerplate.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/typepurify.svg?style=flat-square)](https://www.npmjs.com/package/typepurify)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/vallarasuk/typeclean/actions/workflows/ci.yml/badge.svg)](https://github.com/vallarasuk/typeclean/actions)

## Overview

`typepurify` is a lightning-fast, zero-schema data cleaner designed to deeply strip `null`, `undefined`, and optionally empty strings/arrays/objects from your data maps while keeping your TypeScript types perfectly aligned.

Instead of writing complex Zod or Joi schemas just to clean a payload, `typepurify` automatically re-infers your types at compile-time and safely handles nested records and array structures.

---

## 🧠 How it Works

Understanding how `typepurify` processes your data is simple. It uses a recursive engine to traverse your nested payloads and instantly strips out unwanted, empty, or undefined values based on your configuration.

```mermaid
graph TD
    A[Raw API Payload] --> B(typepurify Engine)
    B --> C{Value Check}

    C -->|null / undefined| D[Discard Property]
    C -->|String / Array / Object| E{IsEmpty? & Options set?}

    E -->|Yes| D
    E -->|No, but it's an Object/Array| F[Recursively Clean Child]
    E -->|No, it's a Primitive| G[Keep Property]

    F --> B
    D --> H[Optimized Output]
    G --> H

    H --> I[(Perfectly Typed Data)]

    style A fill:#4b5563,stroke:#374151,stroke-width:2px,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style I fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

## Installation

```bash
npm install typepurify
# or
yarn add typepurify
# or
pnpm add typepurify
```

## Usage

```typescript
import { clean } from 'typepurify';

const messyPayload = {
  id: 101,
  profile: {
    title: null,
    geo: 'IN',
  },
  tags: ['React', null, 'TypeScript'],
  emptyString: '',
  emptyArray: [],
};

// Standard clean (removes null and undefined natively)
const cleanPayload = clean(messyPayload);
/* Result: 
{ 
  id: 101, 
  profile: { geo: "IN" }, 
  tags: ["React", "TypeScript"], 
  emptyString: "", 
  emptyArray: [] 
} 
*/
// Note: Types are automatically inferred! `title` is instantly removed from the `profile` type at compile time.

// Aggressive clean with Options
const ultraCleanPayload = clean(messyPayload, {
  stripEmptyStrings: true,
  stripEmptyArrays: true,
});
/* Result: 
{ 
  id: 101, 
  profile: { geo: "IN" }, 
  tags: ["React", "TypeScript"] 
} 
*/
```

## API

### `clean<T>(obj: T, options?: CleanOptions): DeepRequired<T>`

Recursively deep-cleans null/undefined values from objects and arrays, dynamically re-inferring compile-time types without generating heavy schemas.

**Options:**

- `stripEmptyStrings` (boolean): Removes empty strings `""`.
- `stripEmptyArrays` (boolean): Removes arrays with zero length `[]`.
- `stripEmptyObjects` (boolean): Removes objects with no keys `{}`.

## Contributing

Contributions, issues, and feature requests are welcome! See our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).

---

## About Me

**Vallarasu Kanthasamy**

I'm a software engineer deeply passionate about creating frictionless, robust developer tools and scalable architectures. I built `typepurify` to eliminate the friction of dealing with messy API payloads in enterprise TypeScript environments.

- GitHub: [@vallarasuk](https://github.com/vallarasuk)
- If you find this package useful, feel free to give it a ⭐️ on GitHub and reach out for collaborations!
