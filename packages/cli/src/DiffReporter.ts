export interface DiffReportEntry {
  path: string;
  action: 'removed' | 'modified' | 'preserved';
  oldValue?: any;
  newValue?: any;
}

export interface DiffReportSummary {
  totalRemoved: number;
  totalPreserved: number;
  estimatedBytesSaved: number;
  entries: DiffReportEntry[];
}

/**
 * CLI DiffReporter formats and visualizes purification diffs for terminal display.
 */
export class DiffReporter {
  static generateSummary(
    original: Record<string, any>,
    cleaned: Record<string, any>,
  ): DiffReportSummary {
    const entries: DiffReportEntry[] = [];
    let estimatedBytesSaved = 0;

    function compare(orig: any, clean: any, path: string): void {
      if (clean === undefined) {
        entries.push({ path, action: 'removed', oldValue: orig });
        estimatedBytesSaved +=
          (orig !== null && orig !== undefined ? JSON.stringify(orig).length : 4) + path.length;
        return;
      }

      if (typeof orig !== 'object' || orig === null) {
        entries.push({ path, action: 'preserved', newValue: clean });
        return;
      }

      if (Array.isArray(orig)) {
        for (let i = 0; i < orig.length; i++) {
          const itemPath = path ? `${path}[${i}]` : `[${i}]`;
          compare(orig[i], clean ? clean[i] : undefined, itemPath);
        }
        return;
      }

      const origKeys = Object.keys(orig);
      for (const k of origKeys) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        const keyPath = path ? `${path}.${k}` : k;
        if (!(k in clean)) {
          entries.push({ path: keyPath, action: 'removed', oldValue: orig[k] });
          estimatedBytesSaved +=
            (orig[k] !== null && orig[k] !== undefined ? JSON.stringify(orig[k]).length : 4) +
            k.length;
        } else {
          compare(orig[k], clean[k], keyPath);
        }
      }
    }

    compare(original, cleaned, '');

    const totalRemoved = entries.filter((e) => e.action === 'removed').length;
    const totalPreserved = entries.filter((e) => e.action === 'preserved').length;

    return {
      totalRemoved,
      totalPreserved,
      estimatedBytesSaved,
      entries,
    };
  }

  static formatTerminal(summary: DiffReportSummary): string {
    const lines: string[] = [
      '================ TypePurify Analysis Summary ================',
      `✔ Fields Preserved: ${summary.totalPreserved}`,
      `✖ Fields Removed:   ${summary.totalRemoved}`,
      `⚡ Bytes Saved:      ~${summary.estimatedBytesSaved} bytes`,
      '-------------------------------------------------------------',
    ];

    for (const entry of summary.entries) {
      if (entry.action === 'removed') {
        lines.push(`  - [REMOVED] ${entry.path}`);
      }
    }

    return lines.join('\n');
  }
}
