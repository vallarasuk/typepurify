import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import {
  EnvValidator,
  findDuplicateDependencies,
  bootstrapProject,
  generateEnvExample,
  runHealthScorer,
  analyzeBundleSize,
} from './index';

vi.mock('fs');

describe('@typepurify/cli', () => {
  describe('EnvValidator', () => {
    it('should parse env file correctly', () => {
      const content = 'DB_HOST=localhost\nDB_USER=root\n# comment\nDB_PASS=';
      const validator = new EnvValidator(content);

      const missing = validator.validate(['DB_HOST', 'DB_USER', 'DB_PASS', 'PORT']);
      expect(missing).toEqual(['DB_PASS', 'PORT']);
    });

    it('should generate env.example', () => {
      const content = 'DB_HOST=localhost\nDB_USER=root';
      const validator = new EnvValidator(content);

      const example = validator.generateExample();
      expect(example).toContain('DB_HOST=\nDB_USER=');
    });
  });

  describe('findDuplicateDependencies', () => {
    it('should find duplicates', () => {
      const pkgs: any[] = [
        { dependencies: { react: '18.0.0', lodash: '4.0.0' } },
        { devDependencies: { typescript: '5.0.0', react: '18.0.0' } },
      ];

      const duplicates = findDuplicateDependencies(pkgs);
      expect(duplicates).toEqual({ react: 2 });
    });
  });

  describe('bootstrapProject', () => {
    it('should create node template', () => {
      (fs.existsSync as any).mockReturnValue(false);
      (fs.mkdirSync as any).mockImplementation(() => {});
      (fs.writeFileSync as any).mockImplementation(() => {});

      bootstrapProject('/tmp/test-proj', 'node');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/test-proj', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // package.json and index.js
    });
  });

  describe('generateEnvExample', () => {
    it('should extract process.env variables from files', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(
        'const x = process.env.API_KEY; const y = process.env.DB_PASS;',
      );

      const out = generateEnvExample(['temp.js']);
      expect(out).toContain('API_KEY=');
      expect(out).toContain('DB_PASS=');
    });
  });

  describe('findUnusedDependencies', () => {
    it('should identify unused dependencies', async () => {
      const { findUnusedDependencies } = await import('./index');

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue("import { clone } from 'lodash';");

      const pkg = {
        dependencies: {
          lodash: '1.0.0',
          moment: '2.0.0',
          '@types/node': '1.0.0',
        },
      };

      const unused = findUnusedDependencies(pkg, ['temp_unused.js']);
      expect(unused).toContain('moment');
      expect(unused).not.toContain('lodash');
      expect(unused).not.toContain('@types/node');
    });
  });

  describe('runHealthScorer', () => {
    it('should return health score for specified project path', () => {
      expect(runHealthScorer('/project/path')).toBe(95);
      expect(runHealthScorer('')).toBe(0);
    });

    it('should return health score via JSON if requested', () => {
      const scoreJSON = runHealthScorer('/project/path', true);
      expect(scoreJSON).toBe(JSON.stringify({ dir: '/project/path', score: 95 }));
    });
  });

  describe('analyzeBundleSize', () => {
    it('should return file count and byte size for directory', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue(['index.js', 'index.mjs']);
      (fs.statSync as any).mockReturnValue({ isFile: () => true, size: 500 });

      const res = analyzeBundleSize('/dist');
      expect(res.totalFiles).toBe(2);
      expect(res.totalSizeBytes).toBe(1000);
    });
  });
});
