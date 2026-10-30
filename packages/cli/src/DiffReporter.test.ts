import { describe, it, expect } from 'vitest';
import { DiffReporter } from './DiffReporter';

describe('DiffReporter', () => {
  it('should generate accurate summary of removed and preserved fields', () => {
    const orig = {
      id: 1,
      name: 'Alice',
      temp: null,
      meta: {
        unused: undefined,
        count: 5,
      },
    };
    const clean = {
      id: 1,
      name: 'Alice',
      meta: {
        count: 5,
      },
    };

    const summary = DiffReporter.generateSummary(orig, clean);
    expect(summary.totalRemoved).toBe(2);
    expect(summary.totalPreserved).toBe(3);
    expect(summary.estimatedBytesSaved).toBeGreaterThan(0);

    const formatted = DiffReporter.formatTerminal(summary);
    expect(formatted).toContain('Fields Removed:   2');
    expect(formatted).toContain('Fields Preserved: 3');
    expect(formatted).toContain('[REMOVED] temp');
    expect(formatted).toContain('[REMOVED] meta.unused');
  });
});
