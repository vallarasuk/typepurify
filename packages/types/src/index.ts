/**
 * Makes all properties in T required deeply.
 */
export type DeepRequired<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? _DeepRequiredArray<U>
    : T extends object
      ? _DeepRequiredObject<T>
      : T | undefined;

interface _DeepRequiredArray<T> extends Array<DeepRequired<T>> {}
type _DeepRequiredObject<T> = {
  [P in keyof T]-?: DeepRequired<NonNullable<T[P]>>;
};

/**
 * Makes all properties in T optional deeply.
 */
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? _DeepPartialArray<U>
    : T extends object
      ? _DeepPartialObject<T>
      : T | undefined;

interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}
type _DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * Removes all undefined or null types deeply.
 */
export type NonNullableDeep<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? _NonNullableArray<U>
    : T extends object
      ? _NonNullableObject<T>
      : NonNullable<T>;

interface _NonNullableArray<T> extends Array<NonNullableDeep<T>> {}
type _NonNullableObject<T> = {
  [P in keyof T]-?: NonNullableDeep<T[P]>;
};

/**
 * A type that can either be T or a Promise that resolves to T.
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * A type representing any function.
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * A type representing any asynchronous function.
 */
export type AnyAsyncFunction = (...args: any[]) => Promise<any>;

/**
 * Extracts the awaited return type of a function.
 */
export type AwaitedReturn<T extends AnyFunction> = Awaited<ReturnType<T>>;
