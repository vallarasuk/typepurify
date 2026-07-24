import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import { EnvValidator, findDuplicateDependencies, bootstrapProject } from './index';

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
});
