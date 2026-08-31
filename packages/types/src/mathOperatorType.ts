/**
 * Advanced type-level math operators for @typepurify/types.
 * Allows compile-time numeric manipulation for static analysis.
 */

// Basic tuple constructor for numeric sizing
export type BuildTuple<L extends number, T extends any[] = []> = T['length'] extends L
  ? T
  : BuildTuple<L, [...T, any]>;

// Compile-time addition
export type Add<A extends number, B extends number> = [
  ...BuildTuple<A>,
  ...BuildTuple<B>,
]['length'] &
  number;

// Compile-time subtraction
export type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest['length'] & number : never;

// Checks if A > B
export type IsGreaterThan<A extends number, B extends number> = A extends B
  ? false
  : BuildTuple<A> extends [...BuildTuple<B>, ...any]
    ? true
    : false;
