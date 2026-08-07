<div align="center">
  <h1>✨ @typepurify/llm</h1>
  <p>AI response utilities, ReDoS-safe JSON extraction, SSE stream parsing, and prompt management.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/llm.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/llm)

## 🚀 Overview

Working with Large Language Models (LLMs) often involves messy text outputs, broken JSON formats, and complicated streaming protocols. `@typepurify/llm` provides a zero-dependency toolkit to sanitize, extract, and stream LLM outputs securely.

## 📦 Installation

```bash
npm install @typepurify/llm
```

## 🛠 Features & Examples

### 1. JSON Extraction & Cleaning

Extracts JSON safely from markdown blocks (` ```json ... ``` `) and fixes common LLM output errors like trailing commas.

```typescript
import { cleanLlmJson, parseMarkdownBlocks } from '@typepurify/llm';

const llmOutput = `Here is your data:
\`\`\`json
{ "name": "Alice", }
\`\`\``;

const safeJsonStr = cleanLlmJson(llmOutput); // => '{ "name": "Alice" }'

// You can also extract all markdown blocks:
const blocks = parseMarkdownBlocks(llmOutput);
console.log(blocks['json']); // Array of JSON blocks
```

### 2. Streaming Chat (SSE Parser)

Effortlessly consume Server-Sent Events (SSE) from OpenAI, Anthropic, or custom endpoints.

```typescript
import { streamChat } from '@typepurify/llm';

async function run() {
  const stream = streamChat('https://api.openai.com/v1/chat/completions', payload, {
    Authorization: 'Bearer sk-...',
  });

  for await (const chunk of stream) {
    console.log(chunk); // Yields clean payload strings incrementally
  }
}
```

### 3. Prompt Templating & Chat Builders

```typescript
import { PromptTemplate, buildChatPrompt } from '@typepurify/llm';

const template = new PromptTemplate('Translate {{text}} to {{lang}}');
const prompt = template.render({ text: 'Hello', lang: 'French' });
// => "Translate Hello to French"
```

### 4. Token Counting & Cost Estimation

Provides fast, regex-free token estimation and cost calculation without importing massive tokenization libraries.

```typescript
import { countTokens, estimateCost, truncateToTokenLimit } from '@typepurify/llm';

const tokens = countTokens('Massive payload...', 'gpt-4o');
const cost = estimateCost(tokens, 'gpt-4o');

// Ensure you never exceed context limits
const safeText = truncateToTokenLimit(hugeText, 8000, 'openai');
```

### 5. Schema Validation

```typescript
import { validateLlmSchema } from '@typepurify/llm';

const isValid = validateLlmSchema(parsedJson, { name: 'string', age: 'number' });
```

### 6. Single Markdown Block Extraction

Extract the first markdown block (e.g., JSON or TypeScript) cleanly from LLM output.

```typescript
import { extractFirstMarkdownBlock } from '@typepurify/llm';

const cleanCode = extractFirstMarkdownBlock(llmOutput, 'typescript');
```

### 7. Message Formatting (`wrapUserMessage`)

Format raw prompt text into structured API message objects.

```typescript
import { wrapUserMessage } from '@typepurify/llm';

const msg = wrapUserMessage('Explain quantum computing');
// => { role: 'user', content: 'Explain quantum computing' }
```

## 🆕 New in v0.5.8

### `TokenCostLimiter` — Budget Enforcement

Enforces a maximum token budget, throwing on breach with remaining balance tracking.

```typescript
import { TokenCostLimiter } from '@typepurify/llm';

const limiter = new TokenCostLimiter(4096);
limiter.spend(1200);
console.log(limiter.remaining); // 2896
limiter.spend(3000); // throws: "Token budget exceeded"
```

### `AgentStateMachine` — Agent Phase Manager

Simple FSM for managing autonomous AI agent execution phases.

```typescript
import { AgentStateMachine } from '@typepurify/llm';

const agent = new AgentStateMachine();
agent.transition('THINKING');
agent.transition('EXECUTING');
agent.getState(); // "EXECUTING"
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`createRagPipelineSummary(documents, query)`** — Summarizes the most relevant documents from a RAG (Retrieval-Augmented Generation) context list for LLM prompts. Filters docs containing the query string and returns the top-3 joined with a `---` separator.

```typescript
import { createRagPipelineSummary } from '@typepurify/llm';

const docs = [
  'TypeScript is a typed superset of JavaScript.',
  'Python is dynamically typed.',
  'TypeScript compiles to plain JavaScript.',
];

const context = createRagPipelineSummary(docs, 'TypeScript');
// => "TypeScript is a typed superset of JavaScript.\n---\nTypeScript compiles to plain JavaScript."
```

**Bug Fixes:**

- Fixed optional field handling (`?`) in `validateLlmSchema` — fields marked optional in the schema no longer cause false-negative validation failures.

### v0.5.1

- Added `extractFirstMarkdownBlock` to pull code/JSON from AI responses.
- Added `sanitizeSystemPrompt` to strip prompt injection patterns.
- Added `wrapUserMessage` for structured LLM message formatting.
