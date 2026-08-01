# Changelog

## [0.5.3] (Core: 1.6.3) - 2026-08-01

### Ecosystem Wide Feature Updates

- **`@typepurify/fetch`**: Added `createCacheFetch` for lightweight in-memory response caching with custom TTL options.
- **Ecosystem Sync**: Bumped version to `0.5.3` across all sub-packages (`typepurify` core @ `1.6.3`).

## [0.5.2] (Core: 1.6.2) - 2026-07-31

### Ecosystem Wide Feature Updates

- **`@typepurify/fetch`**: Added `Http3TransportAdapter` for HTTP/3 QUIC connection management with client-side request throttling.
- **`@typepurify/retry`**: Added `runExclusive` lock execution wrapper method to `RetryLock` class.
- **Documentation**: Updated `ROADMAP.md` tracking status for completed ecosystem features.

## [0.5.1] (Core: 1.6.1) - 2026-07-30

### Ecosystem Wide Feature Updates

- **`@typepurify/react-state`**: Added `useToggle` hook for intuitive boolean state management.
- **`@typepurify/react-table`**: Added `toggleAllColumnVisibility` for bulk column toggling capabilities.
- **`@typepurify/paginate`**: Added `calculateHasPreviousPage` and `calculateHasNextPage` pagination utilities.
- **`@typepurify/cli`**: Added `formatError` and `formatSuccess` terminal text formatters.
- **`@typepurify/logger`**: Added `silent` mode configuration option to effortlessly disable logging.
- **`@typepurify/json`**: Added `isJsonString` pre-parse validation utility.
- **`@typepurify/fetch`**: Added `buildQueryString` for elegant and deep query parameter construction.
- **`@typepurify/dedupe`**: Added support for custom LRU cache injection in `dedupeAsync`.
- **`@typepurify/cache`**: Added `has()` method for non-mutating cache key checks.
- **`@typepurify/llm`**: Added `extractFirstMarkdownBlock` utility to clean up AI code responses.
- **`@typepurify/security`**: Added `generateRandomString` for cryptographically secure API tokens.
- **`@typepurify/retry`**: Introduced `RetryExhaustedError` for precise backoff error propagation.

## [0.4.3] (Core: 1.5.3) - 2026-07-25

### Core Engine (`typepurify` @ 1.5.3)

- **Feature**: Added `stripEmptySets` and `stripEmptyMaps` to `CleanOptions` for finer control over stripping empty Set and Map objects.
- **Fix**: Fixed the logic in `clean` and `cleanInPlace` that inadvertently caused non-empty Set and Map objects to evaluate incorrectly during empty stripping.
- **Tests**: Added full test coverage for Set and Map empty stripping.

### Logger (`@typepurify/logger` @ 0.4.3)

- **Feature**: Added `fatal` log level to the logger.
- **Fix**: Standard `Error` objects now correctly serialize their message, stack, and name instead of evaluating to an empty JSON object.

### Fetch (`@typepurify/fetch` @ 0.4.3)

- **Fix**: Resolved an issue where `AbortController` timeouts would leak memory if the request resolved successfully by correctly clearing the timeout inside a `finally` block.
- **Tests**: Added test cases verifying successful timeout cleanup.

### Maintenance

- Bumped versions of all associated packages (`cache`, `cli`, `dedupe`, `json`, `llm`, `paginate`, `react-state`, `react-table`, `retry`, `security`, `types`) to `0.4.3`.
- Readme updates across all packages reflecting version changes.
