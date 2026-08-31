import { describe, it, expect, vi } from 'vitest';
import { GitHookInjectorV2 } from './gitHookInjectorV2';
import * as fs from 'fs';

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue(''),
    chmodSync: vi.fn(),
  };
});

describe('GitHookInjectorV2', () => {
  it('should inject hook safely', () => {
    const injector = new GitHookInjectorV2('/mock/repo');
    injector.inject('pre-commit', 'npm test');
    expect(fs.appendFileSync).toHaveBeenCalled();
  });
});
