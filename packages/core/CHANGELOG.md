## 1.6.8

### Minor Changes

- Added `inferSchemaBatch(objects)` — Batch schema inference across multiple objects, returning an array of inferred schemas using `inferSchema` under the hood.
- Added `createWasmBindingsAdapter(wasmModule)` — Lightweight adapter pattern to proxy WebAssembly module exports as a callable JavaScript facade.

## 1.6.7

### Patch Changes

- Core typepurify package patch release update.

## 1.6.6

### Patch Changes

- Added `sanitizeObject()` for recursive string transformation.
- Added `crawlArray()` for high-throughput array mapping.
- Added `inferSchema()` for runtime object graph schema inference.
- Added `stripNaN` and `stripInfinity` options to CleanOptions.

## 1.6.3

### Minor Changes

- Ecosystem 1.6.3 update and feature enhancements.

## 1.6.2

### Minor Changes

- Ecosystem release 1.6.2 sync with updated helper utilities.

## 1.6.1

### Minor Changes

- Ecosystem release 1.6.1 feature updates.

## 1.6.0

### Minor Changes

- # v0.4.7 Features Rollout
  - `typepurify`: Added `cloneDeep` utility for robust object cloning.
  - `@typepurify/cache`: Added `deletePattern` method for regex-based cache invalidation.
  - `@typepurify/dedupe`: Added `dedupeAsyncGenerator` to multiplex streaming endpoints.
  - `@typepurify/fetch`: Added `createTimeoutFetch` for automatic request abortion.
  - `@typepurify/json`: Added `safeJsonParse` for try/catch-less parsing.
  - `@typepurify/llm`: Added `calculateCost` alias for seamless cost estimation.
  - `@typepurify/logger`: Added dynamic `logLevel` support via `setLevel`.
  - `@typepurify/paginate`: Added `createCursorPaginator` for simple in-memory pagination.
  - `@typepurify/react-state`: Added `useMap` hook for managing robust Map states.
  - `@typepurify/react-table`: Added dynamic column visibility toggle states.
  - `@typepurify/retry`: Added `withFibonacciBackoff` retry utility.
  - `@typepurify/security`: Added configurable `isStrongPassword` validator.
  - `@typepurify/types`: Added robust `DeepRequired` utility type.
  - `@typepurify/cli`: Added `--verbose` flag capabilities to `runHealthScorer`.

## 1.5.6

### Patch Changes

- Rollout v0.4.6 features across all packages.

## 1.5.5

### Patch Changes

- Fixed missing `vitest` imports (`describe`, `it`, `expect`, `expectTypeOf`) in the test suite that were preventing tests from running correctly.

## 1.5.2

### Minor Changes

- Enhanced core package with advanced utilities and additional test cases

# Changelog

## 1.5.2

### Patch Changes

- Patch release for all packages

## 1.5.0

### Minor Changes

- Update ecosystem features and resolve type errors.

## 1.4.4

### Patch Changes

- Initial release of fetch wrapper and updated ecosystem docs

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.3] - 2026-07-23

### Fixed

- Fixed a bug where `options.transform` evaluation order in `cleanParse` caused primitives and deep objects to skip empty checking logic, bringing it strictly in line with the standard `clean()` core behavior.

## [1.4.2] - 2026-07-22

### Fixed

- Fixed a bug in `cleanParse` where the `options.transform` callback was ignored for `null` values, arrays, and objects, bringing it strictly in line with standard `clean()` engine behavior.

## [1.4.0] - 2026-07-20

### Added

- **The Performance Era Update:** Introduced `cleanParse`, a completely custom, single-pass JSON string parser that dynamically cleans payloads _during_ parsing. This skips intermediate `JSON.parse` object allocations, saving considerable memory overhead and speeding up the process by up to 25% for massive payloads.

## [1.3.4] - 2026-07-18

### Changed

- Completely revamped `README.md` to include visual code examples, copy-pasteable installation scripts, and explicit API parameter definitions.

## [1.3.3] - 2026-07-17

### Fixed

- Fixed a deep cloning bug where circular references returned the uncleaned object instead of the cloned reference in `clean` and `cleanAsync`.

## [1.1.6] - 2026-07-07

### Added

- Added official live preview and documentation website link in README (`typepurify.vallarasuk.com`).

## [1.0.1] - 2026-07-06

### Changed

- Rebranded package to `typepurify` for better organic reach and an industry-standard naming convention.
- Updated all installation instructions, NPM badges, and Mermaid architecture diagrams to reflect the new `typepurify` engine.

## [1.0.0] - 2026-07-06

### Added

- Initial public release of the zero-schema recursive cleaning engine.
- Deep cleaning of `null` and `undefined` properties with native TypeScript inference preservation.
- Optional configuration to aggressively strip empty strings (`""`), empty arrays (`[]`), and empty objects (`{}`).
- Dual CJS and ESM build targets via `tsup`.
- Comprehensive test suite via `vitest`.

## 1.6.8

- Implemented new features as per ROADMAP.
