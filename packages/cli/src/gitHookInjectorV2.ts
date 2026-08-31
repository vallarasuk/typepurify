import * as fs from 'fs';
import * as path from 'path';

/**
 * Advanced Git Hook Injector for @typepurify/cli.
 * Safely writes pre-commit and pre-push hooks without overwriting existing custom bash scripts.
 */
export class GitHookInjectorV2 {
  private gitDir: string;

  constructor(repoRoot: string) {
    this.gitDir = path.join(repoRoot, '.git', 'hooks');
  }

  public inject(hookType: 'pre-commit' | 'pre-push', command: string): void {
    if (!fs.existsSync(this.gitDir)) {
      throw new Error(`Not a git repository: ${this.gitDir}`);
    }

    const hookPath = path.join(this.gitDir, hookType);
    const hookCommand = `\n# --- TypePurify Hook ---\n${command}\n# -----------------------\n`;

    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf8');
      if (!existing.includes('TypePurify Hook')) {
        fs.appendFileSync(hookPath, hookCommand);
      }
    } else {
      fs.writeFileSync(hookPath, `#!/bin/sh${hookCommand}`);
      fs.chmodSync(hookPath, '755');
    }
  }
}
