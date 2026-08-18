# Changelog

## [0.5.10] (Core: 1.6.10) - 2026-08-14

### New Features — All Packages

- **`typepurify` (core)**: Added `optimizeArrayCrawler` — batches array processing to prevent event loop blocking.
- **`@typepurify/fetch`**: Added `throttleHttp3Transport` — a wrapper for `fetch` that restricts max concurrent requests via a queue.
- **`@typepurify/retry`**: Added `broadcastEventEmitterListener` — a class that tracks subscribers and broadcasts custom events to them.
- **`@typepurify/dedupe`**: Added `injectProxyLayer` — uses an ES6 Proxy to deduplicate and cache heavy object property accesses.
- **`@typepurify/paginate`**: Added `hydrateMultiSourceAggregator` — aggregates multiple paginated chunks into a single unified array.
- **`@typepurify/cache`**: Added `trackGraphQLGraphTracker` — generates consistent signatures (base64) from GraphQL query strings for caching.
- **`@typepurify/types`**: Added `compileOpenAPI` — parses primitive OpenAPI `components.schemas` into a simplistic JS representation.
- **`@typepurify/react-table`**: Added `traverseCRDTMultiplayerHook` — processes a stream of `insert` and `delete` CRDT operations to rebuild collaborative table state.
- **`@typepurify/react-state`**: Added `bypassDOMBinder` — directly mutates a React ref's DOM node text content for high-performance updates.
- **`@typepurify/llm`**: Added `chunkMultiModalParser` — chunks a multimodal input stream into arrays constrained by a `maxTokens` limit.
- **`@typepurify/logger`**: Added `optimizeEdgeWorkerLogger` — a class that batches logs into memory and flushes them on demand for Edge execution environments.
- **`@typepurify/security`**: Added `evaluateZeroTrustCompiler` — statically checks a string for unsafe patterns like `eval` or `new Function`.
- **`@typepurify/cli`**: Added `composeDockerImageWizard` — programmatically composes a multi-line `Dockerfile` string from configuration objects.
- **`@typepurify/json`**: Added `translateProtobufExporter` — simulates a Protobuf payload serialization layer by encoding JSON payloads as base64 byte streams.

## [0.5.4] (Core: 1.6.4) - 2026-08-04

### New Features — All Packages

- **`typepurify` (core) `v1.6.4`**: Added `traverseObjectGraph(obj, visitor)` — recursively walks every node of an object graph with full circular reference detection and prototype pollution guards (`__proto__`, `constructor`, `prototype` are skipped).
- **`@typepurify/fetch`**: Added `createRateLimiterFetch(maxPerSec)` — wraps native fetch with a token-bucket rate limiter to prevent burst overload to downstream APIs.
- **`@typepurify/retry`**: Added `RetryEventEmitter` — subscribe to retry lifecycle events (`attempt`, `success`, `failure`, `exhaust`) with typed listeners and automatic unsubscribe support.
- **`@typepurify/dedupe`**: Added `parseGraphQLQueryKey(query, variables?)` — normalizes GraphQL queries into stable, whitespace-normalized cache keys for accurate request deduplication.
- **`@typepurify/paginate`**: Added `parseRelayConnection(connection)` — extracts a flat node array from a GraphQL Relay connection object.
- **`@typepurify/cache`**: Added `FileSystemStorageAdapter` — pluggable async storage adapter with `getItem`, `setItem`, and `removeItem` methods for persistent cache backends.
- **`@typepurify/types`**: Added `RegexMatchLiteral<S, Pattern>` — type-level regex match extraction returning a string union of matching literals.
- **`@typepurify/react-table`**: Added `createHeadlessTableCore(data, columns)` — returns unstyled table metadata (`itemCount`, `columnKeys`, `isEmpty`) for building fully custom table UIs.
- **`@typepurify/react-state`**: Added `createLeaderElectionNode(channelName?)` — multi-tab leader election utility for coordinating shared state across browser tabs.
- **`@typepurify/llm`**: Added `createRagPipelineSummary(documents, query)` — filters and summarizes the top matching documents from a RAG context list for LLM prompts.
- **`@typepurify/logger`**: Added `injectOpenTelemetryTraceHeader(traceId, spanId)` — generates a W3C-compliant `traceparent` header for distributed tracing.
- **`@typepurify/security`**: Added `SlidingWindowSecurityRateLimiter(limit, windowMs)` — sliding window rate limiter for security endpoints to prevent brute-force attacks.
- **`@typepurify/cli`**: Added `runCodemodEngine(sourceCode, transforms)` — applies string and regex transforms to source code for automated migrations.
- **`@typepurify/json`**: Added `parseJsonStreamChunk(jsonArrayStr)` — memory-efficient generator that streams individual JSON objects from a JSON array string.

### Bug Fixes — All Packages

- **`typepurify` (core)**: Fixed `transform` callback TypeScript inference — `(val, key)` parameters now require explicit `any` annotation in strict mode (`TS7006`).
- **`typepurify` (core)**: Fixed `deepOmit` result type — accessing omitted keys requires `(result as any)` cast, properly reflecting the type-level removal.
- **`@typepurify/fetch`**: Added `console.error` logging in `RequestQueue.processQueue()` catch block — socket hangup errors are now surfaced for debugging instead of being silently swallowed.
- **`@typepurify/dedupe`**: Fixed primitive key collision — added type tags (`str:`, `num:`, `bool:`) to dedupe keys preventing `"1"` (string) colliding with `1` (number).
- **`@typepurify/cache`**: Added prototype pollution guard in `Cache.set()` — keys matching `__proto__`, `constructor`, or `prototype` are silently rejected.
- **`@typepurify/llm`**: Fixed optional field handling in `validateLlmSchema` — optional fields no longer cause false-negative validation failures.
- **`@typepurify/logger`**: Added `maxBuffer` cap to `LogRateLimiter` preventing unbounded memory growth during log spikes.
- **`@typepurify/security`**: Added `SameSite` header enforcement in `enforceCsrfToken`.
- **`@typepurify/cli`**: Fixed `analyzeBundleSize` to use `lstatSync` instead of `statSync` to correctly ignore symlinks.
- **`@typepurify/json`**: Fixed `deepMerge` TypeScript signature — sources now typed as `Record<string, any>[]` instead of `Partial<T>[]`, resolving `TS2345` errors when merging objects with different nested shapes.

### Ecosystem Sync

- Bumped `typepurify` core to `1.6.4`.
- Bumped all `@typepurify/*` sub-packages to `0.5.4`.
- Updated all 14 package `README.md` files with new features, usage examples, and changelogs.

---

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
