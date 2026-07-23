import { describe, it, expectTypeOf } from 'vitest';
import type { DeepRequired, DeepPartial, NonNullableDeep, Awaitable, AwaitedReturn } from './index';

describe('@typepurify/types', () => {
  it('DeepRequired should make nested properties required', () => {
    type Input = { a?: { b?: string } };
    type Expected = { a: { b: string } };

    expectTypeOf<DeepRequired<Input>>().toEqualTypeOf<Expected>();
  });

  it('DeepPartial should make nested properties optional', () => {
    type Input = { a: { b: string } };
    type Expected = { a?: { b?: string } };

    expectTypeOf<DeepPartial<Input>>().toEqualTypeOf<Expected>();
  });

  it('NonNullableDeep should remove null/undefined', () => {
    type Input = { a: { b: string | null } | undefined };
    type Expected = { a: { b: string } };

    expectTypeOf<NonNullableDeep<Input>>().toEqualTypeOf<Expected>();
  });

  it('Awaitable can be sync or async', () => {
    const syncVal: Awaitable<number> = 1;
    const asyncVal: Awaitable<number> = Promise.resolve(1);

    expectTypeOf(syncVal).toEqualTypeOf<number | Promise<number>>();
    expectTypeOf(asyncVal).toEqualTypeOf<number | Promise<number>>();
  });

  it('AwaitedReturn extracts return type', () => {
    type AsyncFn = () => Promise<string>;
    expectTypeOf<AwaitedReturn<AsyncFn>>().toEqualTypeOf<string>();
  });
});
