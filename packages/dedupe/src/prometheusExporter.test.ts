import { describe, it, expect } from 'vitest';
import { PrometheusExporter } from './prometheusExporter';

describe('PrometheusExporter', () => {
  it('should export counter correctly', () => {
    const exporter = new PrometheusExporter();
    exporter.register('cache_hits', 'Total cache hits', 'counter');
    exporter.increment('cache_hits', { route: '/api' }, 1);

    const out = exporter.export();
    expect(out).toContain('cache_hits{route="/api"} 1');
  });
});
