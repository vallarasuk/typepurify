/**
 * Streaming JSON parser supporting incremental chunk feeding and line-delimited JSON.
 */
export class StreamingJsonParser {
  private buffer = '';

  feed(chunk: string): any[] {
    this.buffer += chunk;
    const results: any[] = [];
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        results.push(JSON.parse(trimmed));
      } catch {
        // incomplete or malformed chunk
      }
    }
    return results;
  }

  flush(): any[] {
    const trimmed = this.buffer.trim();
    this.buffer = '';
    if (!trimmed) return [];
    try {
      return [JSON.parse(trimmed)];
    } catch {
      return [];
    }
  }

  parse(chunk: string): any {
    const results = this.feed(chunk + '\n');
    return results[0] ?? {};
  }
}
