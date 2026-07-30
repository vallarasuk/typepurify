<div align="center">
  <h1>✨ @typepurify/security</h1>
  <p>Lightweight security inspection tools, secret detection, and input sanitization.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/security.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/security)

## 🚀 Overview

`@typepurify/security` offers zero-dependency, memory-efficient tools for preventing sensitive data leaks, neutralizing XSS payloads, and validating high-security tokens directly in your application boundary.

## 📦 Installation

```bash
npm install @typepurify/security
```

## 🛠 Features & Examples

### 1. In-Memory Secret Detection

Scans deeply nested JSON payloads or strings for leaked API keys, tokens, and credentials (e.g., Google, OpenAI, AWS, GitHub) before they leave your system.

```typescript
import { detectSecrets } from '@typepurify/security';

const payload = {
  user: 'Alice',
  config: { apiKey: 'sk-proj-1234567890abcdef' },
};

const leaks = detectSecrets(payload);
// Returns masked matches like ["sk-p...cdef"] to alert without logging the full secret!
```

### 2. Input Sanitization

```typescript
import { sanitizeUrl, sanitizeFilename, escapeHtml, stripHtmlTags } from '@typepurify/security';

// Neutralizes javascript: or data: payloads
const url = sanitizeUrl('javascript:alert(1)'); // => "about:blank"

// Prevents directory traversal attacks
const filename = sanitizeFilename('../../etc/passwd'); // => "etc_passwd"

// Escapes or strips HTML
escapeHtml('<div>'); // => "&lt;div&gt;"
stripHtmlTags('<p>Hello</p>'); // => "Hello"
```

### 3. JWT Inspection

Inspect payloads and expiration times securely on the client-side without full cryptographic verification.

```typescript
import { inspectJwt, isJwtExpired } from '@typepurify/security';

const token = inspectJwt(myJwtString);
console.log(token?.payload);

if (isJwtExpired(myJwtString)) {
  // Trigger re-authentication
}
```

### 4. Data Masking & Validation

- `maskIPAddress('192.168.1.10')` => `192.168.1.***`
- `maskEmail('user@example.com')` => `us***@example.com`
- `isStrongPassword('password123', { minLength: 8, requireSpecial: true })`
- `enforceCsrfToken(reqToken, sessionToken)`

### 5. Secure Random String Generation

Generate cryptographically secure strings for API keys, passwords, or session IDs.

```typescript
import { generateRandomString } from '@typepurify/security';

const token = generateRandomString(32); // e.g. "a1b2c3d4..."
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
