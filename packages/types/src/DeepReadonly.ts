export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
export const createDeepReadonly = <T>(obj: T): DeepReadonly<T> => obj as any;
