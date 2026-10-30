export interface TaggedCacheOptions {
  maxSize?: number;
  ttl?: number;
}

interface TaggedCacheEntry<T> {
  value: T;
  tags: Set<string>;
  expiresAt?: number;
}

/**
 * Enterprise-grade multi-tag caching engine with tag invalidation.
 */
export class TaggedCache<T = any> {
  private store = new Map<string, TaggedCacheEntry<T>>();
  private tagIndex = new Map<string, Set<string>>();
  private maxSize: number;
  private defaultTtl?: number;

  constructor(options: TaggedCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.ttl;
  }

  set(key: string, value: T, tags: string[] = [], ttl?: number): void {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;

    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }

    if (this.store.has(key)) {
      this.delete(key);
    }

    const tagSet = new Set(tags);
    const expiresAt = (ttl ?? this.defaultTtl) ? Date.now() + (ttl ?? this.defaultTtl!) : undefined;

    this.store.set(key, { value, tags: tagSet, expiresAt });

    for (const tag of tagSet) {
      let keysForTag = this.tagIndex.get(tag);
      if (!keysForTag) {
        keysForTag = new Set();
        this.tagIndex.set(tag, keysForTag);
      }
      keysForTag.add(key);
    }
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    // LRU bump
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    return this.store.delete(key);
  }

  /**
   * Invalidates all cache entries associated with the specified tag.
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    const count = keys.size;
    const keysToDelete = Array.from(keys);
    for (const key of keysToDelete) {
      this.delete(key);
    }
    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * Invalidates all cache entries matching any of the specified tags.
   */
  invalidateTags(tags: string[]): number {
    let total = 0;
    for (const tag of tags) {
      total += this.invalidateTag(tag);
    }
    return total;
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
