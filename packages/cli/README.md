# @typepurify/cli

Simple, lightweight CLI utilities. Part of the TypePurify ecosystem.

## Installation

```bash
npm install @typepurify/cli
```

## Usage

### `parseArgs`

A zero-dependency, tiny command line argument parser that converts `process.argv` into a key-value object.

```typescript
import { parseArgs } from '@typepurify/cli';

// For example, if run with:
// node script.js --verbose --port=8080 --name "Alice"

const args = parseArgs(process.argv.slice(2));

console.log(args);
// {
//   verbose: true,
//   port: '8080',
//   name: 'Alice'
// }
```
