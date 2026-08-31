## 0.5.12

### Patch Changes

- next stage of featurers
- Updated dependencies
  - typepurify@0.5.12

## 0.5.11

### Minor Changes

- Added `reset` and `resetState` — reset form values in `useSmartForm` and restore initial state in `usePurifiedState`.

## 0.5.10

### Minor Changes

- Added `bypassDOMBinder` — directly mutates a React refs DOM node text content for high-performance updates.

## 0.5.8

### Minor Changes

- Added `useUndoRedoState<T>(initial)` — React hook with full undo/redo history stack, cursor navigation, and `canUndo`/`canRedo` guards.
- Added `useImmerDraft<T>(initialState)` — Immer-like React hook for applying mutable draft mutations to immutable state via deep clone.

## 0.5.6

### Patch Changes

- Added `useAsyncEffect()` hook with cancellation flag support.
- Added `useCopyToClipboard()` hook.
- Added `updateAtIndex` method to `useArray` hook.

## 0.5.3

### Minor Changes

- Ecosystem 0.5.3 update and feature enhancements.

## 0.5.2

### Minor Changes

- Ecosystem release 0.5.2 sync with updated helper utilities.

## 0.5.1

### Minor Changes

- Added `useToggle` hook for intuitive boolean state management.

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

- Enhanced react-state package with advanced utilities and additional test cases

# @typepurify/react-state

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

## 0.3.1

### Patch Changes

- fix: add react peerDependencies

## 0.3.0

### Minor Changes

- Initial release for ecosystem packages.

## 0.2.0

### Minor Changes

- Initial release of all packages and advanced networking features for fetch.

## 0.5.8

- Implemented new features as per ROADMAP.
