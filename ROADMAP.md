# 🚀 TypePurify Ecosystem Roadmap (AI-Optimized)

> **Agent Instruction:** When instructed to "build the next feature", find the first package that is not `[x] Completed`. Then, find the first feature within that package that is `[ ] Pending` and implement it. Update the checkbox to `[x]` upon completion.

---

## 1. API & Backend Utilities

### `@typepurify/core` (Formerly `typepurify`)

**Status:** 🟢 Completed (Active Maintenance)
**Description:** The core engine. Removes null, undefined, empty arrays/objects.

- `[x]` feat: `clean()`, `cleanAsync()`, `cleanParse()` APIs.
- `[x]` feat: Deep recursive zero-schema type inference.

### `@typepurify/fetch`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Safe fetch wrapper with auto-purification, retries, timeouts, and JSON parsing.

- `[x]` feat: Initial wrapper around native `fetch`.
- `[x]` feat: Auto-parse and purify JSON responses.
- `[x]` feat: Automatic retry strategies (exponential backoff).
- `[x]` feat: Timeout configuration with AbortController.
- `[x]` feat: Request/Response interceptors.

### `@typepurify/retry`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Standalone retry utility for async functions.

- `[x]` feat: Implement `retry(asyncFn, options)`.
- `[x]` feat: Support exponential backoff and jitter algorithms.
- `[x]` feat: Implement retry limits and timeout bounds.

### `@typepurify/dedupe`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Request deduplicator to prevent duplicate API calls.

- `[x]` feat: In-memory hash-based request caching.
- `[x]` feat: Automatic request debouncing.

### `@typepurify/paginate`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Smart pagination utilities.

- `[x]` feat: Cursor-based pagination parser.
- `[x]` feat: Offset-based pagination parser.
- `[x]` feat: Infinite scroll state machine.

### `@typepurify/cache`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Simple in-memory REST API cache.

- `[x]` feat: TTL-based in-memory caching.
- `[x]` feat: LRU (Least Recently Used) eviction policy.

---

## 2. TypeScript Utilities

### `@typepurify/types`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Advanced TypeScript utility types and helpers.

- `[x]` feat: Deep Type Merge utility type.
- `[x]` feat: JSON to TS Type Generator logic.
- `[x]` feat: Deep Immutable Helper (`DeepReadonly`).
- `[x]` feat: Safe Object Path extractor (`get(obj, "path")`).

---

## 3. React Ecosystem

### `@typepurify/react-table`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Universal, zero-dependency Data Table.

- `[x]` feat: Sorting and Filtering engines.
- `[x]` feat: Pagination state management.
- `[x]` feat: Search and Export to CSV.

### `@typepurify/react-state`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Tiny alternatives for form, loading, and query state.

- `[x]` feat: `useLoading()` - Universal loading state manager.
- `[x]` feat: `useSmartForm()` - Tiny alternative to React Hook Form.
- `[x]` feat: `useApiQuery()` - Tiny alternative to TanStack Query.

---

## 4. AI & LLMs

### `@typepurify/llm`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** AI response utilities.

- `[x]` feat: LLM Response Cleaner (Fixes malformed JSON).
- `[x]` feat: Prompt Template Manager.
- `[x]` feat: Token Counter (OpenAI, Gemini, Claude).
- `[x]` feat: AI Streaming Parser wrapper.

---

## 5. Security & Logging

### `@typepurify/logger`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Enterprise logging suite.

- `[x]` feat: Enterprise Logger (JSON, Colors, File).
- `[x]` feat: Request Logger middleware (Express, Fastify, NestJS).
- `[x]` feat: Error Reporter with beautiful stack traces.

### `@typepurify/security`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Security inspection tools.

- `[x]` feat: Secret Detector (Find API keys in objects).
- `[x]` feat: JWT Inspector and Validator.
- `[x]` feat: Input/URL Sanitizers.

---

## 6. CLI & Dev Productivity

### `@typepurify/cli`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Scaffolding and analysis CLI.

- `[x]` feat: Project Bootstrap CLI (`create-my-stack`).
- `[x]` feat: Duplicate File / Dependency Analyzer.
- `[x]` feat: `.env` Validator and Doc Generator.

---

## 7. JSON Utilities

### `@typepurify/json`

**Status:** 🟢 Completed (Active Maintenance)
**Description:** Advanced JSON manipulation.

- `[x]` feat: Deep JSON Diff engine.
- `[x]` feat: JSON Repair (Fixes invalid strings).
- `[x]` feat: Circular Object Cleaner.
- `[x]` feat: Object Comparison Engine (Ignore specific keys/types).
