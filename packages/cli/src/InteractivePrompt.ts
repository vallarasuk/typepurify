export class InteractivePrompt {
  ask(_question: string): string {
    console.log(_question);
    return 'answer';
  }
}
