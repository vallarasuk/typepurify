// @typepurify/types - Tuple Converter
export type CalculateTupleConverter<T extends readonly any[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? { head: First; tail: Rest; length: T['length'] }
  : { head: never; tail: []; length: 0 };

export type ReverseTuple<T extends readonly any[]> = T extends readonly [infer First, ...infer Rest]
  ? [...ReverseTuple<Rest>, First]
  : [];
