<div align="center">
  <h1>✨ typepurify</h1>
  <p>Deep-clean any API response while preserving precisely inferred recursive types—no schemas, no boilerplate.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/typepurify.svg?style=flat-square)](https://www.npmjs.com/package/typepurify)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/vallarasuk/typepurify/actions/workflows/ci.yml/badge.svg)](https://github.com/vallarasuk/typepurify/actions)

## Overview

`typepurify` is a lightning-fast, zero-schema data cleaner designed to deeply strip `null`, `undefined`, and optionally empty strings/arrays/objects from your data maps while keeping your TypeScript types perfectly aligned.

Instead of writing complex Zod or Joi schemas just to clean a payload, `typepurify` automatically re-infers your types at compile-time and safely handles nested records and array structures.

---

## 🧠 How it Works

Understanding how `typepurify` processes your data is simple. It uses a recursive engine to traverse your nested payloads and instantly strips out unwanted, empty, or undefined values based on your configuration.

<div align="center">
  <img src="https://raw.githubusercontent.com/vallarasuk/typepurify/main/assets/flowchart.svg" alt="typepurify Architecture Engine" width="100%" />
</div>

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

### `cleanInPlace<T>(obj: T, options?: CleanOptions): DeepRequired<T>`

Operates exactly like `clean()`, but **mutates the original payload directly** instead of allocating new objects in memory. This offers maximum performance and zero memory overhead for massive data payloads.

**Options:**

- `stripEmptyStrings` (boolean): Removes empty strings `""`.
- `stripEmptyArrays` (boolean): Removes arrays with zero length `[]`.
- `stripEmptyObjects` (boolean): Removes objects with no keys `{}`.
- `trimStrings` (boolean): Trims whitespace from strings before processing.
- `stripWhen` (function): Custom predicate function to strip any specific value (e.g., `(val) => val === 'N/A'`).

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
