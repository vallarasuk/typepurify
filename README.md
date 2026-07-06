<div align="center">
  <h1>✨ typeclean</h1>
  <p>Deep-clean any API response while preserving precisely inferred recursive types—no schemas, no boilerplate.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/typeclean.svg?style=flat-square)](https://www.npmjs.com/package/typeclean)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Overview

`typeclean` is a lightning-fast, zero-schema data cleaner designed to deeply strip `null`, `undefined`, and optionally empty strings/arrays/objects from your data maps while keeping your TypeScript types perfectly aligned.

Instead of writing complex Zod or Joi schemas just to clean a payload, `typeclean` automatically re-infers your types at compile-time and safely handles nested records and array structures.

## Installation

```bash
npm install typeclean
# or
yarn add typeclean
# or
pnpm add typeclean
```

## Usage

```typescript
import { clean } from 'typeclean';

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

// Standard clean
const cleanPayload = clean(messyPayload);
// -> { id: 101, profile: { geo: "IN" }, tags: ["React", "TypeScript"], emptyString: "", emptyArray: [] }
// Note: Types are automatically inferred! `title` is removed from `profile`.

// With Options
const ultraCleanPayload = clean(messyPayload, {
  stripEmptyStrings: true,
  stripEmptyArrays: true,
});
// -> { id: 101, profile: { geo: "IN" }, tags: ["React", "TypeScript"] }
```

## API

### `clean<T>(obj: T, options?: CleanOptions): DeepRequired<T>`

Recursively deep-cleans null/undefined values from objects and arrays, dynamically re-inferring compile-time types without schemas.

**Options:**

- `stripEmptyStrings` (boolean): Removes empty strings `""`.
- `stripEmptyArrays` (boolean): Removes arrays with zero length `[]`.
- `stripEmptyObjects` (boolean): Removes objects with no keys `{}`.

## Contributing

Contributions, issues, and feature requests are welcome! See our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).
