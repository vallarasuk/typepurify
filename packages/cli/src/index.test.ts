import { describe, it, expect } from 'vitest';
import { parseArgs } from './index';

describe('@typepurify/cli', () => {
  it('should parse boolean flags', () => {
    const args = ['--verbose', '--force'];
    const result = parseArgs(args);

    expect(result).toEqual({
      verbose: true,
      force: true,
    });
  });

  it('should parse key-value pairs with equals sign', () => {
    const args = ['--name=alice', '--age=30'];
    const result = parseArgs(args);

    expect(result).toEqual({
      name: 'alice',
      age: '30',
    });
  });

  it('should parse key-value pairs separated by space', () => {
    const args = ['--name', 'bob', '--age', '25'];
    const result = parseArgs(args);

    expect(result).toEqual({
      name: 'bob',
      age: '25',
    });
  });

  it('should parse mixed arguments', () => {
    const args = ['--verbose', '--name=charlie', '--city', 'new york'];
    const result = parseArgs(args);

    expect(result).toEqual({
      verbose: true,
      name: 'charlie',
      city: 'new york',
    });
  });
});
