/**
 * Represents a single message in an LLM conversation.
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Basic template literal tag to strip leading indentation from multiline prompt strings.
 * This makes it much easier to write readable prompts in code.
 *
 * @param strings The template strings array
 * @param values The interpolated values
 */
export function prompt(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }

  // Find the smallest indentation level
  const lines = result.split('\n');
  let minIndent = Infinity;

  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (indent < minIndent) minIndent = indent;
  }

  // Remove that indentation from all lines
  if (minIndent !== Infinity && minIndent > 0) {
    result = lines
      .map((line) => (line.startsWith(' '.repeat(minIndent)) ? line.slice(minIndent) : line))
      .join('\n');
  }

  return result.trim();
}
