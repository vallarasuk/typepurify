import { describe, it, expect } from 'vitest';
import { HighSpeedLogger } from './HighSpeedLogger';

describe('HighSpeedLogger', () => {
  it('should log info messages and respect minimum log level', () => {
    const logger = new HighSpeedLogger({ minLevel: 'warn' });
    const debugEntry = logger.debug('debug trace');
    expect(debugEntry).toBeNull();

    const warnEntry = logger.warn('disk full', { disk: '/dev/sda' });
    expect(warnEntry).not.toBeNull();
    expect(warnEntry?.level).toBe('warn');
    expect(warnEntry?.meta?.disk).toBe('/dev/sda');
    expect(logger.getHistory().length).toBe(1);
  });

  it('should capture timestamps on entries', () => {
    const logger = new HighSpeedLogger({ minLevel: 'debug' });
    const entry = logger.info('startup');
    expect(entry?.timestamp).toBeDefined();
    expect(new Date(entry!.timestamp).getTime()).toBeGreaterThan(0);
  });
});
