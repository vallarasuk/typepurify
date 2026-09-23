export class StreamDeduplicator {
  dedupe(items: any[]): any[] {
    return Array.from(new Set(items));
  }
}
