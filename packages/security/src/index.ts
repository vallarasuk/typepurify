/**
 * Regular expressions for common secrets.
 */
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\\-_]{35}/, // Google API Key
  /sk-(?:[a-zA-Z0-9]{48}|proj-[a-zA-Z0-9]+)/, // OpenAI API Key
  /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}/, // Slack Token
  /gh[pousr]_[A-Za-z0-9_]{36}/, // GitHub Token
  /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/, // AWS Access Key
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/, // Generic UUID/Token
  /ya29\.[0-9A-Za-z_-]+/, // GCP OAuth Token
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
      const matches = str.match(new RegExp(pattern, 'g'));
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
export function enforceCsrfToken(reqToken: string, sessionToken: string): boolean {
  // Using timing-safe equality in a real scenario
  return reqToken === sessionToken && reqToken.length > 32;
}
