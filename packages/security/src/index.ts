/**
 * Regular expressions for common secrets.
 */
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\\-_]{35}/, // Google API Key
  /sk-(?:[a-zA-Z0-9]{48}|proj-[a-zA-Z0-9]+)/, // OpenAI API Key
  /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}/, // Slack Token
  /gh[pousr]_[A-Za-z0-9_]{36}/, // GitHub Token
];

/**
 * Scans a string or object for potential secrets.
 * Returns an array of detected secrets (masked).
 */
export function detectSecrets(input: any): string[] {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  if (!str) return [];

  const found: string[] = [];
  for (const pattern of SECRET_PATTERNS) {
    const matches = str.match(new RegExp(pattern, 'g'));
    if (matches) {
      for (const match of matches) {
        // Mask the secret for reporting
        const masked = match.substring(0, 4) + '...' + match.substring(match.length - 4);
        found.push(masked);
      }
    }
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
