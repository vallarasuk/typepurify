export class PromptTemplateEngine {
  render(template: string, _vars: Record<string, any>) {
    console.log(_vars);
    return template;
  }
}
