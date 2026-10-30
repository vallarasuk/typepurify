export interface PromptOptions {
  defaultValue?: string;
  validate?: (input: string) => boolean | string;
  choices?: string[];
}

/**
 * Interactive prompt helper supporting defaults, validation, and predefined choices.
 */
export class InteractivePrompt {
  private answers: Map<string, string> = new Map();

  preset(question: string, answer: string): void {
    this.answers.set(question, answer);
  }

  ask(question: string, options: PromptOptions = {}): string {
    const rawAnswer = this.answers.get(question) ?? options.defaultValue ?? '';

    if (options.validate) {
      const valid = options.validate(rawAnswer);
      if (valid !== true) {
        throw new Error(typeof valid === 'string' ? valid : 'Validation failed for prompt');
      }
    }

    if (options.choices && options.choices.length > 0 && !options.choices.includes(rawAnswer)) {
      throw new Error(
        `Invalid choice "${rawAnswer}". Expected one of: ${options.choices.join(', ')}`,
      );
    }

    return rawAnswer;
  }
}
