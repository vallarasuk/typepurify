# @typepurify/security

Security inspection tools, including memory-efficient secret detection and JWT inspection.

## Installation

```bash
npm install @typepurify/security
```

## Usage

### `escapeHtml`

Converts characters like `<`, `>`, `&`, `"`, and `'` to their HTML entities to safely embed user input in HTML.

```typescript
import { escapeHtml } from '@typepurify/security';

const userInput = '<script>alert("XSS")</script>';
const safeHtml = escapeHtml(userInput);
// Output: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

### `sanitizeFilename`

Strips invalid OS characters and directory traversal patterns (like `../`) from filenames to securely process user uploads.

```typescript
import { sanitizeFilename } from '@typepurify/security';

const safeFile = sanitizeFilename('../../../etc/passwd<illegal>.txt');
// Output: etc_passwd_illegal_.txt
```

### `detectSecrets`

Memory-efficient, zero-allocation tree-walking utility to discover and mask exposed secrets (AWS keys, GCP tokens, etc.) inside plain strings or deep object hierarchies.

```typescript
import { detectSecrets } from '@typepurify/security';

const configPayload = {
  apiKey: 'AKIAIOSFODNN7EXAMPLE',
  user: 'admin',
};

const masked = detectSecrets(configPayload);
// Output: { apiKey: 'AKIA***************E', user: 'admin' }
```

### `enforceCsrfToken`

Strict timing-safe equality check for validating CSRF tokens above a secure length threshold.

```typescript
import { enforceCsrfToken } from '@typepurify/security';

const isValid = enforceCsrfToken(req.header('X-CSRF-Token'), session.csrfToken);
```

### New in v0.4.6

- Added `stripHtmlTags(input)` to sanitize inputs by removing HTML tags entirely.
