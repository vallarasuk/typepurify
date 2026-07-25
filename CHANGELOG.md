# Changelog

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
