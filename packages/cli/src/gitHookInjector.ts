// @typepurify/cli - Git Hook Injector
import fs from 'fs';
import path from 'path';

export function injectGitHook(hookName: 'pre-commit' | 'pre-push', scriptContent: string): boolean {
  try {
    const gitPath = path.join(process.cwd(), '.git', 'hooks');
    if (!fs.existsSync(gitPath)) {
      return false; // Not a git repo
    }

    const hookFile = path.join(gitPath, hookName);

    const content = `#!/bin/sh\n\n# Auto-injected by TypePurify CLI\n${scriptContent}\n`;

    fs.writeFileSync(hookFile, content);
    fs.chmodSync(hookFile, '755'); // Make executable
    return true;
  } catch {
    return false;
  }
}
