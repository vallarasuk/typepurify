export interface PromptRenderOptions {
  strict?: boolean;
  fallback?: string;
}

/**
 * Enhanced prompt template engine supporting nested variable paths and strict mode.
 */
export class PromptTemplateEngine {
  render(template: string, vars: Record<string, any>, options: PromptRenderOptions = {}): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
      const parts = path.split('.');
      let curr = vars;
      for (const p of parts) {
        if (curr === null || curr === undefined) break;
        curr = curr[p];
      }
      if (curr !== undefined && curr !== null) {
        return String(curr);
      }
      if (options.strict) {
        throw new Error(`Missing required template variable: ${path}`);
      }
      return options.fallback ?? '';
    });
  }
}
