export interface MemoryBufferCacheOptions {
  maxSize?: number;
  ttl?: number;
}

interface CacheNode {
  value: any;
  expiresAt?: number;
}

/**
 * A memory-bounded cache buffer with LRU eviction and TTL expiration.
 */
export class MemoryBufferCache {
  private cache = new Map<string, CacheNode>();
  private maxSize: number;
  private defaultTtl?: number;

  constructor(options: MemoryBufferCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.ttl;
  }

  set(key: string, value: any, ttl?: number): void {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const first = this.cache.keys().next().value;
      if (first !== undefined) this.cache.delete(first);
    }

    const expiresAt =
      ttl !== undefined
        ? Date.now() + ttl
        : this.defaultTtl !== undefined
          ? Date.now() + this.defaultTtl
          : undefined;

    this.cache.delete(key);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any {
    const node = this.cache.get(key);
    if (!node) return undefined;

    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU bump
    this.cache.delete(key);
    this.cache.set(key, node);
    return node.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
