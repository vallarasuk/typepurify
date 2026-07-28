# @typepurify/llm

AI response utilities, ReDoS-safe JSON extraction from LLM outputs, stream parsing, and prompt management.

## Installation

```bash
npm install @typepurify/llm
```

## Usage

### `prompt` template tag

Write clean, readable multi-line prompts in your code without messing up indentation when sent to the API. It strips the common leading whitespace.

```typescript
import { prompt } from '@typepurify/llm';

const persona = 'pirate';
const userMessage = 'Explain quantum physics';

const p = prompt`
  You are an expert who speaks like a ${persona}.
  
  Please answer the following request:
    - User says: "${userMessage}"
  
  Be concise.
`;

console.log(p);
// You are an expert who speaks like a pirate.
//
// Please answer the following request:
//   - User says: "Explain quantum physics"
//
// Be concise.
```

### `countTokens` and `truncateToTokenLimit`

Roughly approximate token counts without installing heavy tokenizers, and truncate your text to fit within context limits safely.

```typescript
import { countTokens, truncateToTokenLimit } from '@typepurify/llm';

// Approximate token counts for string constraints
const tokens = countTokens('A very long prompt text...', 'gpt-4o');

// Safely truncate strings that exceed token limits
const safePrompt = truncateToTokenLimit('Massive user input payload...', 8000, 'claude');
```

### New in v0.4.6

- Added `streamChat(messages, model)` to handle stream-based generation natively with a unified async generator.
