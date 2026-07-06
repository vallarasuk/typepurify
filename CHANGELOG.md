# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
