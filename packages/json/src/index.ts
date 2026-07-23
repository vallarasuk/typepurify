import { cleanParse as coreCleanParse, type CleanOptions } from 'typepurify';

/**
 * Safely parses a JSON string, applying TypePurify's cleanParse.
 * If parsing fails and a fallback is provided, it returns the fallback.
 * Otherwise, it throws the error.
 *
 * @param jsonString The JSON string to parse
 * @param fallback Optional fallback value if parsing fails
 * @param options TypePurify options to use during parsing
 */
export function safeParse<T = any>(jsonString: string, fallback?: T, options?: CleanOptions): T {
  try {
    return coreCleanParse(jsonString, options) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Safely stringifies an object to a JSON string.
 * If a circular reference or other error occurs, it catches it and returns a fallback (default: '{}').
 *
 * @param obj The object to stringify
 * @param fallback Optional fallback string if stringify fails (default: '{}')
 * @param replacer JSON.stringify replacer
 * @param space JSON.stringify space
 */
export function safeStringify(
  obj: any,
  fallback: string = '{}',
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number,
): string {
  try {
    return JSON.stringify(obj, replacer, space);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return fallback;
  }
}
