interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set a value in the cache with a specified TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieve a value from the cache if it hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Explicitly delete a key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Periodic cleanup of expired keys to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const analyticsCache = new MemoryCache();

// Run cleanup every 5 minutes safely
if (typeof setInterval !== "undefined") {
  setInterval(() => analyticsCache.cleanup(), 5 * 60 * 1000);
}
