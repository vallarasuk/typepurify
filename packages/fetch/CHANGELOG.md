## 0.5.10\n\n### Minor Changes\n\n- Added `throttleHttp3Transport` — a wrapper for fetch that restricts max concurrent requests via a queue.\n\n## 0.5.8

### Minor Changes

- Added `parseFetchPayload(response)` — Detects `content-type` header and automatically parses JSON or text response bodies.
- Added `createConnectionPoolerFetch(maxConnections)` — Limits concurrent in-flight requests using a semaphore-style queue.

## 0.5.6

### Patch Changes

- Added `createMockFetchAdapter()` helper for unit testing fetch calls.

## 0.5.3

### Minor Changes

- Added `createCacheFetch` utility for in-memory response caching with configurable TTL.

## 0.5.2

### Minor Changes

- Added `Http3TransportAdapter` for HTTP/3 QUIC connection management with client-side request throttling.

## 0.5.1

### Minor Changes

- Added `buildQueryString` for elegant and deep query parameter construction.

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

- Enhanced fetch package with advanced utilities and additional test cases

# @typepurify/fetch

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

- Initial release of all packages and advanced networking features for fetch.

## 0.2.0

### Minor Changes

- Initial release of fetch wrapper and updated ecosystem docs

### Patch Changes

- Updated dependencies
  - typepurify@1.4.4

## 0.5.8

- Implemented new features as per ROADMAP.
