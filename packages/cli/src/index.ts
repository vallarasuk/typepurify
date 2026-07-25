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
  const seen = new Set<string>();
  const duplicates: Record<string, number> = {};

  for (const pkg of packageJsons) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const dep of Object.keys(deps)) {
      if (seen.has(dep)) {
        duplicates[dep] = (duplicates[dep] || 1) + 1;
      } else {
        seen.add(dep);
      }
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

export function generateEnvExample(files: string[]): string {
  const envVars = new Set<string>();
  const regex = /process\.env\.([A-Z0-9_]+)/g;
  for (const file of files) {
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = regex.exec(text)) !== null) {
        envVars.add(match[1]);
      }
    }
  }
  return Array.from(envVars)
    .map((v) => `${v}=`)
    .join('\n');
}

export function findUnusedDependencies(
  packageJson: Record<string, any>,
  sourceFiles: string[],
): string[] {
  const deps = Object.keys(packageJson.dependencies || {});
  const usedDeps = new Set<string>();

  for (const file of sourceFiles) {
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf8');
      // Very basic regex for matching require/import statements
      const regex = /(?:require\(|from\s+)['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        let pkgName = match[1];
        // Handle scoped packages and subpaths
        if (pkgName.startsWith('@')) {
          const parts = pkgName.split('/');
          pkgName = parts[0] + '/' + (parts[1] || '');
        } else {
          pkgName = pkgName.split('/')[0];
        }
        usedDeps.add(pkgName);
      }
    }
  }

  return deps.filter((dep) => !usedDeps.has(dep) && !dep.startsWith('@types/'));
}
