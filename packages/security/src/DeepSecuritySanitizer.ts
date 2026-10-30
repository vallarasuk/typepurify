import { clean } from 'typepurify';

export interface DeepSanitizerOptions {
  stripNoSqlOperators?: boolean;
  neutralizeSqlInjection?: boolean;
  stripPrototypePollution?: boolean;
}

const SQL_INJECTION_PATTERN =
  /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE)\b|--|\/\*|\*\/|;\s*DROP)/i;

/**
 * Recursively scans and neutralizes security attack vectors across deep object graphs.
 */
export class DeepSecuritySanitizer {
  static sanitize<T = any>(data: T, options: DeepSanitizerOptions = {}): T {
    const stripNoSql = options.stripNoSqlOperators ?? true;
    const neutralizeSql = options.neutralizeSqlInjection ?? true;
    const stripProto = options.stripPrototypePollution ?? true;

    function walk(val: any): any {
      if (val === null || val === undefined) return val;

      if (typeof val === 'string') {
        if (neutralizeSql && SQL_INJECTION_PATTERN.test(val)) {
          return val.replace(SQL_INJECTION_PATTERN, '[SUSPICIOUS_SQL]');
        }
        return val;
      }

      if (typeof val !== 'object') return val;

      if (Array.isArray(val)) {
        return val.map((item) => walk(item));
      }

      const result: Record<string, any> = {};
      for (const [key, propVal] of Object.entries(val)) {
        if (stripProto && (key === '__proto__' || key === 'constructor' || key === 'prototype')) {
          continue;
        }
        if (stripNoSql && key.startsWith('$')) {
          continue; // Strip MongoDB/NoSQL injection operators
        }
        result[key] = walk(propVal);
      }
      return result;
    }

    const sanitized = walk(data);
    return clean(sanitized) as T;
  }
}
