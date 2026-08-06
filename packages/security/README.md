<div align="center">
  <h1>✨ @typepurify/security</h1>
  <p>Lightweight security inspection tools and input sanitization for TypeScript.</p>
</div>

---

## 🚀 Overview

`@typepurify/security` offers zero-dependency tools for preventing sensitive data leaks, neutralizing payload risks, and validating high-security tokens directly in your application boundary.

## 📦 Installation

```bash
npm install @typepurify/security
```

## 🛠 Features & Utility Functions

### 1. In-Memory Secret Detection

Scans nested JSON payloads or strings for sensitive patterns before sending over the network.

```typescript
import { detectSecrets } from '@typepurify/security';

const payload = { user: 'Alice', token: 'sample-token' };
const leaks = detectSecrets(payload);
```

### 2. Input Sanitization

```typescript
import { sanitizeUrl, sanitizeFilename, escapeHtml, stripHtmlTags } from '@typepurify/security';

const url = sanitizeUrl('https://example.com');
const filename = sanitizeFilename('user_upload.png');
const safeHtml = escapeHtml('<div>');
```

### 3. JWT Inspection

Inspect payloads and expiration times securely on the client-side.

```typescript
import { inspectJwt, isJwtExpired } from '@typepurify/security';

const token = inspectJwt(myJwtString);
const expired = isJwtExpired(myJwtString);
```

### 4. Data Masking & Validation

- `maskIPAddress('192.168.1.10')` => `192.168.1.***`
- `maskEmail('user@example.com')` => `us***@example.com`
- `isStrongPassword('Password123!', { minLength: 8 })`
- `isSqlInjectionAttempt("SELECT * FROM users")`
- `enforceCsrfToken(reqToken, sessionToken)`

### 5. Secure Random String Generation

```typescript
import { generateRandomString } from '@typepurify/security';

const token = generateRandomString(32);
```

## 🛡️ License

MIT © [Vallarasu Kanthasamy](https://github.com/vallarasuk)
