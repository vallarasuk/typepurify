## [0.5.14] - 2026-08-31

### New Features

- Added `VirtualizedListRenderer` — calculations for rendering virtualized paginated lists.

## 0.5.12

### Patch Changes

- next stage of featurers
- Updated dependencies
  - typepurify@0.5.12

## 0.5.11

### Minor Changes

- Added `getPaginationInfo` — calculate comprehensive pagination metadata from dataset stats.

## 0.5.10

### Minor Changes

- Added `hydrateMultiSourceAggregator` — aggregates multiple paginated chunks into a single unified array.

## 0.5.8

### Minor Changes

- Added `collectPaginatedChunks(map, activePage)` — Memory-safe paginated chunk garbage collector that removes inactive page entries from a Map store.
- Added `calculateVirtualListItems(total, pageSize, page)` — Computes slice start/end offsets for virtualized list rendering.

## 0.5.6

### Patch Changes

- Added `filterPaginatedItems()` for dynamic item filtering and pagination metadata calculation.

## 0.5.3

### Minor Changes

- Ecosystem 0.5.3 update and feature enhancements.

## 0.5.2

### Minor Changes

- Ecosystem release 0.5.2 sync with updated helper utilities.

## 0.5.1

### Minor Changes

- Added `calculateHasPreviousPage` and `calculateHasNextPage` pagination utilities.

## 0.5.0

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

### Patch Changes

- Updated dependencies
  - typepurify@1.6.0

## 0.4.6

### Patch Changes

- Rollout v0.4.6 features across all packages.
- Updated dependencies
  - typepurify@1.5.6

## 0.4.5

### Minor Changes

- Enhanced paginate package with advanced utilities and additional test cases

# @typepurify/paginate

## 0.4.2

### Patch Changes

- Patch release for all packages
- Updated dependencies
  - typepurify@1.5.2

## 0.4.0

### Minor Changes

- Update ecosystem features and resolve type errors.

### Patch Changes

- Updated dependencies
  - typepurify@1.5.0

## 0.3.0

### Minor Changes

- Initial release for ecosystem packages.

## 0.2.0

### Minor Changes

- Initial release of all packages and advanced networking features for fetch.

## 0.5.8

- Implemented new features as per ROADMAP.
