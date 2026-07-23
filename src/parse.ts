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

    if (c === 0x7b) return parseObject(key); // '{'
    if (c === 0x5b) return parseArray(key); // '['
    if (c === 0x22) return parseString(key); // '"'
    if (c === 0x74) return parseTrue(key); // 't'
    if (c === 0x66) return parseFalse(key); // 'f'
    if (c === 0x6e) return parseNull(key); // 'n'

    // Numbers
    if (c === 0x2d || (c >= 0x30 && c <= 0x39)) {
      return parseNumber(key);
    }

    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function processPrimitive(val: any, key?: any): any {
    if (options.transform) {
      val = options.transform(val, key);
    }
    if (val === null || val === undefined) return undefined;
    if (options.stripWhen && options.stripWhen(val)) return undefined;
    if (typeof val === 'string') {
      if (options.trimStrings) val = val.trim();
      if (val === '' && options.stripEmptyStrings) return undefined;
    }
    return val;
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
    return processPrimitive(parseStringRaw(), key);
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
    return processPrimitive(num, key);
  }

  function parseTrue(key?: any): any {
    if (json.slice(i, i + 4) === 'true') {
      i += 4;
      return processPrimitive(true, key);
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseFalse(key?: any): any {
    if (json.slice(i, i + 5) === 'false') {
      i += 5;
      return processPrimitive(false, key);
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseNull(key?: any): any {
    if (json.slice(i, i + 4) === 'null') {
      i += 4;
      return processPrimitive(null, key);
    }
    throw new SyntaxError(`Unexpected token at position ${i}`);
  }

  function parseArray(key?: any): any {
    i++; // '['
    skipWhitespace();

    const arr: any[] = [];

    if (json.charCodeAt(i) === 0x5d) {
      // ']'
      i++;
    } else {
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
    }

    let result: any = arr;
    if (options.transform) {
      result = options.transform(result, key);
    }

    if (result === null || result === undefined) return undefined;
    if (options.stripWhen && options.stripWhen(result)) return undefined;

    if (result === arr) {
      if (arr.length === 0 && options.stripEmptyArrays) return undefined;
    } else {
      if (options.stripEmptyArrays && Array.isArray(result) && result.length === 0)
        return undefined;
      if (
        options.stripEmptyObjects &&
        typeof result === 'object' &&
        !Array.isArray(result) &&
        Object.keys(result).length === 0
      )
        return undefined;
    }

    return result;
  }

  function parseObject(key?: any): any {
    i++; // '{'
    skipWhitespace();

    const obj: Record<string, any> = {};
    let hasKeys = false;

    if (json.charCodeAt(i) === 0x7d) {
      // '}'
      i++;
    } else {
      while (i < len) {
        skipWhitespace();
        if (json.charCodeAt(i) !== 0x22) {
          // '"'
          throw new SyntaxError(`Expected string key at position ${i}`);
        }

        const objKey = parseStringRaw();

        skipWhitespace();
        if (json.charCodeAt(i) !== 0x3a) {
          // ':'
          throw new SyntaxError(`Expected ':' at position ${i}`);
        }
        i++; // skip ':'

        const val = parseValue(objKey);
        if (val !== undefined) {
          obj[objKey] = val;
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
    }

    let result: any = obj;
    if (options.transform) {
      result = options.transform(result, key);
    }

    if (result === null || result === undefined) return undefined;
    if (options.stripWhen && options.stripWhen(result)) return undefined;

    if (result === obj) {
      if (!hasKeys && options.stripEmptyObjects) return undefined;
    } else {
      if (
        options.stripEmptyObjects &&
        typeof result === 'object' &&
        !Array.isArray(result) &&
        Object.keys(result).length === 0
      )
        return undefined;
      if (options.stripEmptyArrays && Array.isArray(result) && result.length === 0)
        return undefined;
    }

    return result;
  }

  const result = parseValue();
  skipWhitespace();
  if (i < len) {
    throw new SyntaxError(`Unexpected data after JSON at position ${i}`);
  }

  return result as any;
}
