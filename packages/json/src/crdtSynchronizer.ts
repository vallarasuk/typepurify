export interface CrdtOp {
  id: string;
  timestamp: number;
  type: 'set' | 'delete';
  key: string;
  value?: any;
}

/**
 * Conflict-free Replicated Data Type (CRDT) Synchronizer for @typepurify/json.
 * Uses LWW-Element-Set (Last-Write-Wins) strategy for decentralized JSON merging.
 */
export class CrdtSynchronizer {
  private state: Map<string, { value: any; timestamp: number }> = new Map();

  public apply(ops: CrdtOp[]): void {
    // Sort ops chronologically to ensure deterministic merging
    ops.sort((a, b) => a.timestamp - b.timestamp).forEach((op) => {
      const current = this.state.get(op.key);
      if (!current || op.timestamp > current.timestamp) {
        if (op.type === 'set') {
          this.state.set(op.key, { value: op.value, timestamp: op.timestamp });
        } else if (op.type === 'delete') {
          // Tombstone
          this.state.set(op.key, { value: undefined, timestamp: op.timestamp });
        }
      }
    });
  }

  public getState(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, record] of this.state.entries()) {
      if (record.value !== undefined) {
        result[key] = record.value;
      }
    }
    return result;
  }
}
