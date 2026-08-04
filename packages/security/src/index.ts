/* eslint-disable no-control-regex */
/**
 * Regular expressions for common secrets.
 */

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\\-_]{35}/g, // Google API Key
  /sk-(?:[a-zA-Z0-9]{48}|proj-[a-zA-Z0-9]+)/g, // OpenAI API Key
  /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}/g, // Slack Token
  /gh[pousr]_[A-Za-z0-9_]{36}/g, // GitHub Token
  /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, // AWS Access Key
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, // Generic UUID/Token
  /ya29\.[0-9A-Za-z_-]+/g, // GCP OAuth Token
];

/**
 * Scans a string or object for potential secrets.
 * Returns an array of detected secrets (masked).
 */
export function detectSecrets(input: any): string[] {
  if (!input) return [];

  const found: string[] = [];

  const checkString = (str: string) => {
    for (const pattern of SECRET_PATTERNS) {
      const matches = str.match(pattern);
      if (matches) {
        for (const match of matches) {
          const masked = match.substring(0, 4) + '...' + match.substring(match.length - 4);
          found.push(masked);
        }
      }
    }
  };

  if (typeof input === 'string') {
    checkString(input);
  } else if (typeof input === 'object') {
    // Fast recursive string search without allocating a massive JSON payload
    const seen = new WeakSet();
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null || seen.has(obj)) return;
      seen.add(obj);
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (typeof obj[i] === 'string') checkString(obj[i]);
          else traverse(obj[i]);
        }
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (typeof val === 'string') checkString(val);
            else traverse(val);
          }
        }
      }
    };
    traverse(input);
  }

  return found;
}

/**
 * Basic JWT Inspector. Decodes payload without verification.
 */
export function inspectJwt(token: string): { header: any; payload: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decodeBase64Url = (str: string) => {
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      return typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf-8');
    };

    return {
      header: JSON.parse(decodeBase64Url(parts[0])),
      payload: JSON.parse(decodeBase64Url(parts[1])),
    };
  } catch {
    return null;
  }
}

/**
 * Validates if a JWT is expired based on its 'exp' claim.
 */
export function isJwtExpired(token: string): boolean {
  const inspected = inspectJwt(token);
  if (!inspected || !inspected.payload.exp) return true; // Treat invalid/no-exp as expired

  // exp is in seconds, convert to ms
  return Date.now() >= inspected.payload.exp * 1000;
}

/**
 * Sanitizes URLs to prevent javascript: or data: XSS attacks.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return 'about:blank';
  }

  return trimmed;
}

/**
 * Basic HTML input sanitizer. Escapes HTML entities.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function maskIPAddress(ip: string): string {
  return ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.***');
}
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return user.substring(0, 2) + '***@' + domain;
}

export function isEmail(email: string): boolean {
  // Simple regex for format validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * CSRF token validator engine for high-security endpoints.
 */
export function enforceCsrfToken(
  reqToken: string,
  sessionToken: string,
  sameSiteHeader?: string,
): boolean {
  if (sameSiteHeader && sameSiteHeader.toLowerCase() === 'none') {
    return false; // Reject unsafe SameSite=None without Lax/Strict protection
  }
  return reqToken === sessionToken && reqToken.length > 32;
}

/**
 * Sanitizes input filenames against directory traversal attacks and invalid system characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  return filename
    .replace(/\\/g, '/')
    .replace(/\.\.\//g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\u0000-\u001F]/g, '_')
    .trim();
}

/**
 * Completely strips all HTML tags from a string.
 * Useful for preventing XSS when you only want raw text.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

export interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
}

/**
 * Validates a password against configurable strength criteria.
 */
export function isStrongPassword(password: string, options: PasswordOptions = {}): boolean {
  if (!password) return false;

  const minLength = options.minLength ?? 8;
  if (password.length < minLength) return false;

  if (options.requireUppercase !== false && !/[A-Z]/.test(password)) return false;
  if (options.requireLowercase !== false && !/[a-z]/.test(password)) return false;
  if (options.requireNumbers !== false && !/[0-9]/.test(password)) return false;
  if (options.requireSpecial !== false && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
}

import { createHash, randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random hex string of the specified byte length.
 */
export function generateRandomString(byteLength: number = 16): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generates a SHA-256 hash of a string input for secure data checksums.
 */
export function hashString(input: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(input).digest('hex');
}

/**
 * Sanitizes HTTP header values against CRLF injection attacks.
 */
export function sanitizeHeaderValue(value: string): string {
  if (!value) return '';
  return value.replace(/[\r\n]/g, '');
}

/**
 * Sliding window rate limiter for security endpoints to prevent IP spoofing and brute-force.
 */
export class SlidingWindowSecurityRateLimiter {
  private requests: number[] = [];

  constructor(
    private limit: number = 100,
    private windowMs: number = 60000,
  ) {}

  isAllowed(timestamp: number = Date.now()): boolean {
    this.requests = this.requests.filter((t) => timestamp - t < this.windowMs);
    if (this.requests.length >= this.limit) return false;
    this.requests.push(timestamp);
    return true;
  }
}
