import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor() {
    // Cache com TTL padrão de 15 minutos (900 segundos)
    this.cache = new NodeCache({ stdTTL: 900 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 900);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }
}

export const cacheService = new CacheService(); 