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

### 5. Terminal Formatting

Format success, warning, and error messages elegantly for your CLI outputs.

```typescript
import { formatError, formatSuccess, formatWarning } from '@typepurify/cli';

console.log(formatSuccess('Task completed successfully!'));
console.log(formatWarning('Deprecated flag used'));
console.error(formatError('Task failed'));
```

## 🆕 New in v0.5.8

### `generateDockerComposeYaml(...)` — Docker Compose Generator

Generates a Docker Compose v3.8 YAML string with service definition, port mapping, and environment variables.

```typescript
import { generateDockerComposeYaml } from '@typepurify/cli';

const yaml = generateDockerComposeYaml('api', 'node:18-alpine', 3000, {
  NODE_ENV: 'production',
  PORT: '3000',
});
```

### `generateCiPipelineYaml(nodeVersion)` — GitHub Actions Generator

Generates a GitHub Actions CI workflow YAML with install and test steps.

```typescript
import { generateCiPipelineYaml } from '@typepurify/cli';

const yaml = generateCiPipelineYaml('20.x');
// Outputs: name: CI, on: [push, pull_request], ...
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`runCodemodEngine(sourceCode, transforms)`** — Applies a list of string or regex transformations to source code programmatically. Designed for automated code migrations and refactoring scripts.

```typescript
import { runCodemodEngine } from '@typepurify/cli';

const updated = runCodemodEngine('var x = 1; var y = 2;', [
  { from: /var/g, to: 'const' },
  { from: 'x', to: 'myVar' },
]);
// => "const myVar = 1; const y = 2;"
```

**Bug Fixes:**

- `analyzeBundleSize` now uses `fs.lstatSync` instead of `statSync` to correctly ignore symlinks and avoid double-counting linked files.

### v0.5.1

- Added `formatError`, `formatSuccess`, `formatWarning` ANSI terminal formatters.
- Added `formatTable` for ASCII table rendering.
- Added `runHealthScorer` for project health analysis.

## 0.5.8 Updates

Includes new features.
