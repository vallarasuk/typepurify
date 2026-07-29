<div align="center">
  <h1>✨ @typepurify/cli</h1>
  <p>Scaffolding and analysis CLI tool for generating TypePurify resources and maintaining repository health.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/cli.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/cli)

## 🚀 Overview

`@typepurify/cli` contains scripts and programmatic APIs to manage monorepos, validate `.env` files, analyze bundles, and scaffold new projects.

## 📦 Installation

```bash
npm install -g @typepurify/cli
```

## 🛠 Features & Examples

### 1. `.env` Validation & Generation

Programmatically parse, validate, and auto-generate `.env.example` files to keep your team's environments synced.

```typescript
import { EnvValidator, generateEnvExample } from '@typepurify/cli';

// Ensure required keys exist
const validator = new EnvValidator(envContent);
const missing = validator.validate(['DATABASE_URL', 'API_KEY']);

// Scan source files for process.env.* usages and create a .env.example
const example = generateEnvExample(['./src/index.ts', './src/app.ts']);
```

### 2. Monorepo Dependency Analysis

Find unused or duplicate dependencies across your `package.json` files to reduce bloat.

```typescript
import { findDuplicateDependencies, findUnusedDependencies } from '@typepurify/cli';

const duplicates = findDuplicateDependencies([pkg1, pkg2]);
const unused = findUnusedDependencies(pkg1, ['./src/index.ts']);
```

### 3. Project Scaffolding

Bootstrap a minimal Node or React project instantly.

```typescript
import { bootstrapProject } from '@typepurify/cli';

bootstrapProject('./my-app', 'react');
```

### 4. Health & Bundle Analytics

```typescript
import { runHealthScorer, analyzeBundleSize } from '@typepurify/cli';

const score = runHealthScorer('./src', true);
const bundle = analyzeBundleSize('./dist');
console.log(`Bundle Size: ${bundle.totalSizeBytes} bytes`);
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
