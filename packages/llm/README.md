# @typepurify/llm

Utilities for working with Large Language Models. Part of the TypePurify ecosystem.

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
