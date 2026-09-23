export class MemoryBufferCache {
  private cache = new Map<string, any>();
  set(key: string, value: any) {
    this.cache.set(key, value);
  }
  get(key: string) {
    return this.cache.get(key);
  }
}
