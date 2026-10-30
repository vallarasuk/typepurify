import { describe, it, expect } from 'vitest';
import { DeepSecuritySanitizer } from './DeepSecuritySanitizer';

describe('DeepSecuritySanitizer', () => {
  it('should strip NoSQL query operator injection keys', () => {
    const maliciousQuery = {
      user: 'alice',
      password: { $ne: null },
      $where: 'sleep(1000)',
      profile: {
        role: 'user',
        $gt: 0,
      },
    };

    const sanitized = DeepSecuritySanitizer.sanitize(maliciousQuery);
    expect(sanitized.user).toBe('alice');
    expect((sanitized as any).password).toEqual({});
    expect((sanitized as any).$where).toBeUndefined();
    expect((sanitized.profile as any).$gt).toBeUndefined();
    expect(sanitized.profile.role).toBe('user');
  });

  it('should neutralize SQL injection vectors in string values', () => {
    const input = {
      search: "' UNION SELECT * FROM users --",
      valid: 'normal query',
    };

    const sanitized = DeepSecuritySanitizer.sanitize(input);
    expect(sanitized.search).toContain('[SUSPICIOUS_SQL]');
    expect(sanitized.valid).toBe('normal query');
  });
});
