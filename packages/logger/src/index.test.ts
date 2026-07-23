import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, Logger } from './index';

describe('@typepurify/logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize successfully', () => {
    const logger = createLogger();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log info by default', () => {
    const logger = createLogger();
    logger.info('test info');
    expect(console.info).toHaveBeenCalledWith('test info');
    logger.debug('test debug');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should respect the log level', () => {
    const logger = createLogger({ level: 'error' });
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('test error');
  });

  it('should prefix logs when configured', () => {
    const logger = createLogger({ prefix: 'MyPrefix' });
    logger.info('test info');
    expect(console.info).toHaveBeenCalledWith('[MyPrefix]', 'test info');
  });

  it('should append timestamps when configured', () => {
    const logger = createLogger({ timestamp: true });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    logger.info('test info');
    expect(console.info).toHaveBeenCalledWith('[2026-01-01T00:00:00.000Z]', 'test info');

    vi.useRealTimers();
  });

  it('should format message with multiple arguments', () => {
    const logger = createLogger({ prefix: 'APP', timestamp: true });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    logger.warn('Warning user', { id: 1 }, 'retry 2');
    expect(console.warn).toHaveBeenCalledWith(
      '[2026-01-01T00:00:00.000Z]',
      '[APP]',
      'Warning user',
      { id: 1 },
      'retry 2',
    );

    vi.useRealTimers();
  });

  it('should be completely silent if level is silent', () => {
    const logger = createLogger({ level: 'silent' });
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});
