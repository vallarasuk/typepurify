import * as fs from 'fs';
import * as path from 'path';

/**
 * Basic `.env` validator and doc generator.
 * Parses a .env file and extracts its keys, throwing if any required keys are missing.
 * Can also generate a `.env.example`.
 */
export class EnvValidator {
  private envMap: Record<string, string> = {};

  constructor(envContent: string) {
    this.parse(envContent);
  }

  private parse(content: string) {
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        this.envMap[match[1]] = match[2] || '';
      }
    }
  }

  validate(requiredKeys: string[]): string[] {
    const missing: string[] = [];
    for (const key of requiredKeys) {
      if (!(key in this.envMap) || this.envMap[key] === '') {
        missing.push(key);
      }
    }
    return missing;
  }

  generateExample(): string {
    const keys = Object.keys(this.envMap);
    return keys.map((k) => `${k}=`).join('\n');
  }
}

/**
 * Analyzes package.json for duplicate dependencies across workspaces or sections.
 */
export function findDuplicateDependencies(
  packageJsons: Record<string, any>[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const pkg of packageJsons) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const dep of Object.keys(deps)) {
      counts[dep] = (counts[dep] || 0) + 1;
    }
  }

  const duplicates: Record<string, number> = {};
  for (const [dep, count] of Object.entries(counts)) {
    if (count > 1) {
      duplicates[dep] = count;
    }
  }

  return duplicates;
}

/**
 * Basic bootstrap command to scaffold a project structure.
 */
export function bootstrapProject(targetDir: string, template: 'node' | 'react' = 'node'): void {
  // Mock implementation for bootstrapping a project
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const pkgJson = {
    name: path.basename(targetDir),
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: template === 'react' ? 'vite' : 'node index.js',
    },
  };

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

  if (template === 'node') {
    fs.writeFileSync(path.join(targetDir, 'index.js'), 'console.log("Hello Node!");');
  } else {
    fs.writeFileSync(
      path.join(targetDir, 'index.jsx'),
      'export default () => <div>Hello React</div>;',
    );
  }
}
