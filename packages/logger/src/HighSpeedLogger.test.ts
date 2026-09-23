import { describe, it, expect } from 'vitest';
import { HighSpeedLogger } from './HighSpeedLogger';
describe('HighSpeedLogger', () => {
  it('works', () => {
    expect(new HighSpeedLogger().log('a')).toBe('a');
  });
});
