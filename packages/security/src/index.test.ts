import { describe, it, expect, vi } from 'vitest';
import {
  detectSecrets,
  inspectJwt,
  isJwtExpired,
  sanitizeUrl,
  escapeHtml,
  maskIPAddress,
  maskEmail,
  enforceCsrfToken,
  sanitizeFilename,
} from './index';

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

  describe('maskIPAddress', () => {
    it('should mask ip', () => {
      expect(maskIPAddress('192.168.1.100')).toBe('192.168.1.***');
    });
  });
  describe('maskEmail', () => {
    it('should mask email', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });
  });

  describe('isEmail', () => {
    it('should validate emails correctly', async () => {
      const { isEmail } = await import('./index');
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('test@.com')).toBe(false);
    });
  });

  describe('detectSecrets extensions', () => {
    it('should detect AWS keys', () => {
      const secrets = detectSecrets('AKIAIOSFODNN7EXAMPLE');
      expect(secrets).toHaveLength(1);
      expect(secrets[0]).toBe('AKIA...MPLE');
    });

    it('should detect GCP tokens', () => {
      const secrets = detectSecrets('ya29.a0AfB_byCM');
      expect(secrets).toHaveLength(1);
      expect(secrets[0]).toBe('ya29...byCM');
    });
  });

  describe('enforceCsrfToken', () => {
    it('should validate matching CSRF tokens over 32 chars in length', () => {
      const validToken = 'a'.repeat(33);
      expect(enforceCsrfToken(validToken, validToken)).toBe(true);
      expect(enforceCsrfToken('short', 'short')).toBe(false);
      expect(enforceCsrfToken(validToken, 'b'.repeat(33))).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should strip path traversal relative paths and invalid OS characters', () => {
      const dirty = '../../../etc/passwd<illegal>';
      const cleanName = sanitizeFilename(dirty);
      expect(cleanName).not.toContain('../');
      expect(cleanName).not.toContain('<');
      expect(cleanName).toBe('etc_passwd_illegal_');
    });
  });

  describe('stripHtmlTags', () => {
    it('should strip out html tags fully', async () => {
      const { stripHtmlTags } = await import('./index');
      expect(stripHtmlTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
      expect(stripHtmlTags('<script>alert(1)</script>')).toBe('alert(1)');
      expect(stripHtmlTags('Safe text')).toBe('Safe text');
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', async () => {
      const { isStrongPassword } = await import('./index');
      expect(isStrongPassword('StrongP@ss123!')).toBe(true);
      expect(isStrongPassword('weak')).toBe(false);
      expect(isStrongPassword('NoSpecial123')).toBe(false);
      expect(isStrongPassword('NoNumbers@')).toBe(false);

      // With custom options
      expect(
        isStrongPassword('weak', {
          minLength: 4,
          requireUppercase: false,
          requireNumbers: false,
          requireSpecial: false,
        }),
      ).toBe(true);
    });
  });

  describe('generateRandomString', () => {
    it('should generate a secure random hex string', async () => {
      const { generateRandomString } = await import('./index');
      const randomStr = generateRandomString(16);
      expect(randomStr).toHaveLength(32); // 16 bytes = 32 hex chars

      const another = generateRandomString(16);
      expect(randomStr).not.toBe(another);
    });
  });

  describe('hashString', () => {
    it('should generate SHA-256 hash of a string', async () => {
      const { hashString } = await import('./index');
      const hash1 = hashString('hello');
      const hash2 = hashString('hello');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('sanitizeHeaderValue', () => {
    it('should strip CRLF characters from header value', async () => {
      const { sanitizeHeaderValue } = await import('./index');
      expect(sanitizeHeaderValue('value\r\nSet-Cookie: stolen')).toBe('valueSet-Cookie: stolen');
    });
  });

  describe('SlidingWindowSecurityRateLimiter', () => {
    it('should limit request frequency in sliding window', async () => {
      const { SlidingWindowSecurityRateLimiter } = await import('./index');
      const limiter = new SlidingWindowSecurityRateLimiter(2, 1000);
      expect(limiter.isAllowed(100)).toBe(true);
      expect(limiter.isAllowed(200)).toBe(true);
      expect(limiter.isAllowed(300)).toBe(false); // limit exceeded
    });
  });

  describe('isSqlInjectionAttempt', () => {
    it('should detect SQL injection payloads', async () => {
      const { isSqlInjectionAttempt } = await import('./index');
      expect(isSqlInjectionAttempt("SELECT * FROM users WHERE '1'='1'")).toBe(true);
      expect(isSqlInjectionAttempt('hello world')).toBe(false);
    });
  });

  describe('scanVulnerabilities', () => {
    it('should scan payload and report detected vulnerabilities', async () => {
      const { scanVulnerabilities } = await import('./index');
      const report = scanVulnerabilities('<script>alert(1)</script> UNION SELECT * FROM users');
      expect(report.hasVulnerabilities).toBe(true);
      expect(report.issues).toContain('SQL_INJECTION');
      expect(report.issues).toContain('XSS_ATTACK');
    });
  });

  describe('createRaspMiddleware', () => {
    it('should intercept malicious requests in RASP middleware', async () => {
      const { createRaspMiddleware } = await import('./index');
      const middleware = createRaspMiddleware();
      const next = vi.fn();
      expect(() => middleware({ body: { query: 'DROP TABLE users' } }, null, next)).toThrow(
        'RASP security violation detected',
      );
    });
  });

  describe('JwtKeyRotator', () => {
    it('should rotate JWT signing keys and track previous key', async () => {
      const { JwtKeyRotator } = await import('./index');
      const rotator = new JwtKeyRotator('secret-v1');
      expect(rotator.getActiveKey()).toBe('secret-v1');
      expect(rotator.getPreviousKey()).toBeNull();
      rotator.rotate('secret-v2');
      expect(rotator.getActiveKey()).toBe('secret-v2');
      expect(rotator.getPreviousKey()).toBe('secret-v1');
    });
  });

  describe('analyzeAstForInjection', () => {
    it('should block dangerous AST nodes', async () => {
      const { analyzeAstForInjection } = await import('./index');

      const safeAst = { type: 'Program', body: [{ type: 'ExpressionStatement' }] };
      expect(analyzeAstForInjection(safeAst)).toBe(false);

      const maliciousAst1 = JSON.parse(
        '{"type":"ObjectExpression","properties":{"__proto__":{"admin":true}}}',
      );
      expect(analyzeAstForInjection(maliciousAst1)).toBe(true);

      const maliciousAst2 = {
        type: 'Program',
        body: [{ type: 'CallExpression', callee: { constructor: { name: 'Function' } } }],
      };
      expect(analyzeAstForInjection(maliciousAst2)).toBe(true);
    });
  });
});
