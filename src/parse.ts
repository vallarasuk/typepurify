import type { CleanOptions, DeepRequired } from './index';

/**
 * A specialized JSON parser that deeply cleans a JSON string in a single pass,
 * avoiding the creation of intermediate messy objects. This significantly reduces
 * memory allocations for huge API payloads.
 *
 * @param json The JSON string to parse and clean.
 * @param options Configuration for stripping empty values.
 * @returns A brand new object with null/undefined/empty values removed.
 */
export function cleanParse<T, const O extends CleanOptions = {}>(
  json: string,
  options: O = {} as O,
): DeepRequired<T, O> {
  let i = 0;
  const len = json.length;

  function skipWhitespace() {
    while (i < len) {
      const c = json.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
        i++;
      } else {
        break;
      }
    }
  }

  function parseValue(key?: any): any {
    skipWhitespace();
    if (i >= len) throw new SyntaxError('Unexpected end of JSON input');

    const c = json.charCodeAt(i);

    if (c === 0x7b) return parseObject(); // '{'
    if (c === 0x5b) return parseArray(); // '['
    if (c === 0x22) return parseString(key); // '"'
    if (c === 0x74) return parseTrue(key); // 't'
    if (c === 0x66) return parseFalse(key); // 'f'
    if (c === 0x6e) return parseNull(); // 'n'

    // Numbers
    if (c === 0x2d || (c >= 0x30 && c <= 0x39)) {
      return parseNumber(key);
    }

    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseStringRaw(): string {
    i++; // Skip opening quote
    let result = '';
    let start = i;

    while (i < len) {
      const c = json.charCodeAt(i);
      if (c === 0x22) {
        // '"'
        result += json.slice(start, i);
        i++;
        return result;
      }
      if (c === 0x5c) {
        // '\'
        result += json.slice(start, i);
        i++;
        const escapeChar = json.charAt(i);
        if (escapeChar === '"') result += '"';
        else if (escapeChar === '\\') result += '\\';
        else if (escapeChar === '/') result += '/';
        else if (escapeChar === 'b') result += '\b';
        else if (escapeChar === 'f') result += '\f';
        else if (escapeChar === 'n') result += '\n';
        else if (escapeChar === 'r') result += '\r';
        else if (escapeChar === 't') result += '\t';
        else if (escapeChar === 'u') {
          const hex = json.slice(i + 1, i + 5);
          result += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else {
          throw new SyntaxError(`Invalid escape character at position ${i}`);
        }
        i++;
        start = i;
        continue;
      }
      i++;
    }
    throw new SyntaxError('Unterminated string');
  }

  function parseString(key?: any): any {
    let str = parseStringRaw();
    if (options.transform) {
      const transformed = options.transform(str, key);
      if (transformed !== str) return transformed;
    }

    if (options.trimStrings) str = str.trim();
    if (str === '' && options.stripEmptyStrings) return undefined;

    if (options.stripWhen && options.stripWhen(str)) return undefined;

    return str;
  }

  function parseNumber(key?: any): any {
    const start = i;
    if (json.charCodeAt(i) === 0x2d) i++; // '-'

    while (i < len) {
      const c = json.charCodeAt(i);
      // Digits, '.', 'e', 'E', '+', '-'
      if (
        (c >= 0x30 && c <= 0x39) ||
        c === 0x2e ||
        c === 0x65 ||
        c === 0x45 ||
        c === 0x2b ||
        c === 0x2d
      ) {
        i++;
      } else {
        break;
      }
    }

    const num = Number(json.slice(start, i));
    if (options.transform) {
      const transformed = options.transform(num, key);
      if (transformed !== num) return transformed;
    }
    if (options.stripWhen && options.stripWhen(num)) return undefined;

    return num;
  }

  function parseTrue(key?: any): any {
    if (json.slice(i, i + 4) === 'true') {
      i += 4;
      const val = true;
      if (options.transform) {
        const transformed = options.transform(val, key);
        if (transformed !== val) return transformed;
      }
      if (options.stripWhen && options.stripWhen(val)) return undefined;
      return val;
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseFalse(key?: any): any {
    if (json.slice(i, i + 5) === 'false') {
      i += 5;
      const val = false;
      if (options.transform) {
        const transformed = options.transform(val, key);
        if (transformed !== val) return transformed;
      }
      if (options.stripWhen && options.stripWhen(val)) return undefined;
      return val;
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseNull(): any {
    if (json.slice(i, i + 4) === 'null') {
      i += 4;
      // We always strip null natively, as per clean() logic
      return undefined;
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseArray(): any {
    i++; // '['
    skipWhitespace();

    const arr: any[] = [];

    if (json.charCodeAt(i) === 0x5d) {
      // ']'
      i++;
      if (options.stripEmptyArrays) return undefined;
      return arr;
    }

    let index = 0;
    while (i < len) {
      const val = parseValue(index);
      if (val !== undefined) {
        arr.push(val);
      }
      index++;

      skipWhitespace();
      const c = json.charCodeAt(i);
      if (c === 0x5d) {
        // ']'
        i++;
        break;
      }
      if (c === 0x2c) {
        // ','
        i++;
      } else {
        throw new SyntaxError(`Expected ',' or ']' at position ${i}`);
      }
    }

    if (arr.length === 0 && options.stripEmptyArrays) return undefined;
    if (options.stripWhen && options.stripWhen(arr)) return undefined;

    return arr;
  }

  function parseObject(): any {
    i++; // '{'
    skipWhitespace();

    const obj: Record<string, any> = {};
    let hasKeys = false;

    if (json.charCodeAt(i) === 0x7d) {
      // '}'
      i++;
      if (options.stripEmptyObjects) return undefined;
      return obj;
    }

    while (i < len) {
      skipWhitespace();
      if (json.charCodeAt(i) !== 0x22) {
        // '"'
        throw new SyntaxError(`Expected string key at position ${i}`);
      }

      const key = parseStringRaw();

      skipWhitespace();
      if (json.charCodeAt(i) !== 0x3a) {
        // ':'
        throw new SyntaxError(`Expected ':' at position ${i}`);
      }
      i++; // skip ':'

      const val = parseValue(key);
      if (val !== undefined) {
        obj[key] = val;
        hasKeys = true;
      }

      skipWhitespace();
      const c = json.charCodeAt(i);
      if (c === 0x7d) {
        // '}'
        i++;
        break;
      }
      if (c === 0x2c) {
        // ','
        i++;
      } else {
        throw new SyntaxError(`Expected ',' or '}' at position ${i}`);
      }
    }

    if (!hasKeys && options.stripEmptyObjects) return undefined;
    if (options.stripWhen && options.stripWhen(obj)) return undefined;

    return obj;
  }

  const result = parseValue();
  skipWhitespace();
  if (i < len) {
    throw new SyntaxError(`Unexpected data after JSON at position ${i}`);
  }

  if (result === undefined) {
    // If the entire payload was stripped to undefined, typepurify core logic
    // handles it as undefined, but for top-level JSON we might just return undefined.
  }

  return result as any;
}
