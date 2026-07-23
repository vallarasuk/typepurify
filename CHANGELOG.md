# Changelog

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
