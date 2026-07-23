/**
 * Escapes HTML characters in a string to prevent XSS attacks.
 * Replaces &, <, >, ", and ' with their corresponding HTML entities.
 *
 * @param str The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips all HTML tags from a string.
 *
 * @param str The string to strip
 * @returns The stripped string
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>?/gm, '');
}

/**
 * A simple utility to sanitize a URL.
 * Ensures the URL only uses http://, https://, or mailto: protocols.
 * Returns '#' if the URL is dangerous (e.g., javascript:).
 *
 * @param url The URL to sanitize
 * @returns The sanitized URL or '#'
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '#';

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:')
  ) {
    return '#';
  }

  return trimmed;
}
