import { describe, it, expect } from 'vitest';
import { detectSecrets, inspectJwt, isJwtExpired, sanitizeUrl, escapeHtml } from './index';

describe('@typepurify/security', () => {
  describe('detectSecrets', () => {
    it('should find and mask secrets in strings', () => {
      const text = 'Here is my key: sk-123456789012345678901234567890123456789012345678';
      const secrets = detectSecrets(text);
      expect(secrets).toHaveLength(1);
      expect(secrets[0]).toBe('sk-1...5678'); // First 4, Last 4
    });

    it('should find secrets in objects', () => {
      const obj = { token: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' };
      const secrets = detectSecrets(obj);
      expect(secrets).toHaveLength(1);
      expect(secrets[0]).toBe('ghp_...6789');
    });

    it('should return empty if no secrets', () => {
      expect(detectSecrets('safe text')).toEqual([]);
    });
  });

  describe('JWT', () => {
    // Header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // Payload: {"sub":"123","exp":9999999999} -> eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.signature';
    const expiredJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjF9.signature'; // exp = 1

    it('should inspect valid JWT', () => {
      const inspected = inspectJwt(validJwt);
      expect(inspected?.header.alg).toBe('HS256');
      expect(inspected?.payload.sub).toBe('123');
    });

    it('should return null for invalid JWT', () => {
      expect(inspectJwt('invalid')).toBeNull();
    });

    it('should correctly identify expired tokens', () => {
      expect(isJwtExpired(validJwt)).toBe(false);
      expect(isJwtExpired(expiredJwt)).toBe(true);
      expect(isJwtExpired('invalid')).toBe(true);
    });
  });

  describe('Sanitizers', () => {
    it('should sanitize dangerous URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('  JaVaScRiPt:alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('about:blank');
      expect(sanitizeUrl('https://google.com')).toBe('https://google.com');
    });

    it('should escape HTML', () => {
      expect(escapeHtml('<script>alert("1 & 2")</script>')).toBe(
        '&lt;script&gt;alert(&quot;1 &amp; 2&quot;)&lt;/script&gt;',
      );
    });
  });
});
