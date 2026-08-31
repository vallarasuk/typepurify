export interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  values: { labels: Record<string, string>; value: number }[];
}

/**
 * Prometheus Metric Exporter for @typepurify/dedupe.
 * Useful for tracking deduplication hit rates and cache saves in production.
 */
export class PrometheusExporter {
  private metrics: Map<string, Metric> = new Map();

  /**
   * Registers a new metric.
   */
  register(name: string, help: string, type: 'counter' | 'gauge' | 'histogram'): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { name, help, type, values: [] });
    }
  }

  /**
   * Increments a counter metric.
   */
  increment(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      throw new Error(`Metric ${name} is not a registered counter.`);
    }

    const existing = metric.values.find((v) => this.matchLabels(v.labels, labels));
    if (existing) {
      existing.value += value;
    } else {
      metric.values.push({ labels, value });
    }
  }

  /**
   * Exports the metrics in Prometheus text format.
   */
  export(): string {
    let output = '';
    for (const metric of this.metrics.values()) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
      for (const val of metric.values) {
        const labelStr = Object.entries(val.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        const labelSuffix = labelStr ? `{${labelStr}}` : '';
        output += `${metric.name}${labelSuffix} ${val.value}\n`;
      }
      output += '\n';
    }
    return output;
  }

  private matchLabels(a: Record<string, string>, b: Record<string, string>): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (a[key] !== b[key]) return false;
    }
    return true;
  }
}
