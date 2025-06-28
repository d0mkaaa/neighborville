
export class PerformanceCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.ceil(this.maxSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0
    };
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize: number = 50
): T & { cache: Map<string, ReturnType<T>>; clearCache: () => void } {
  const cache = new Map<string, ReturnType<T>>();

  const memoizedFunc = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<string, ReturnType<T>>; clearCache: () => void };

  memoizedFunc.cache = cache;
  memoizedFunc.clearCache = () => cache.clear();

  return memoizedFunc;
}

export function createLazyLoader<T>(
  loader: () => Promise<T>,
  fallback?: T
): {
  load: () => Promise<T>;
  isLoaded: () => boolean;
  getValue: () => T | undefined;
  reset: () => void;
} {
  let loadPromise: Promise<T> | null = null;
  let loadedValue: T | undefined = undefined;
  let isLoaded = false;

  return {
    load: async (): Promise<T> => {
      if (loadPromise) {
        return loadPromise;
      }

      if (isLoaded && loadedValue !== undefined) {
        return loadedValue;
      }

      loadPromise = loader().then(value => {
        loadedValue = value;
        isLoaded = true;
        loadPromise = null;
        return value;
      }).catch(error => {
        loadPromise = null;
        throw error;
      });

      return loadPromise;
    },

    isLoaded: (): boolean => isLoaded,

    getValue: (): T | undefined => loadedValue || fallback,

    reset: (): void => {
      loadPromise = null;
      loadedValue = undefined;
      isLoaded = false;
    }
  };
}

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
}

export function createImageLazyLoader(): {
  observe: (img: HTMLImageElement, src: string) => void;
  unobserve: (img: HTMLImageElement) => void;
  disconnect: () => void;
} {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );

  return {
    observe: (img: HTMLImageElement, src: string) => {
      img.dataset.src = src;
      observer.observe(img);
    },

    unobserve: (img: HTMLImageElement) => {
      observer.unobserve(img);
    },

    disconnect: () => {
      observer.disconnect();
    }
  };
}

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const values = this.metrics.get(label);
    
    if (!values || values.length === 0) {
      return null;
    }

    return {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }

  getAllMetrics(): Record<string, ReturnType<PerformanceMonitor['getMetrics']>> {
    const result: Record<string, ReturnType<PerformanceMonitor['getMetrics']>> = {};
    
    for (const label of this.metrics.keys()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const globalCache = new PerformanceCache(200);
export const requestDeduplicator = new RequestDeduplicator();
export const performanceMonitor = new PerformanceMonitor();
export const imageLoader = createImageLazyLoader();

export const SecurityUtils = {
  sanitizeHTML: (html: string): string => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  isValidURL: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests: number[] = [];
    
    return (): boolean => {
      const now = Date.now();
      
      while (requests.length > 0 && requests[0] <= now - windowMs) {
        requests.shift();
      }
      
      if (requests.length >= maxRequests) {
        return false;
      }
      
      requests.push(now);
      return true;
    };
  },

  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

export type CacheStats = ReturnType<PerformanceCache<any>['getStats']>;
export type PerformanceMetrics = ReturnType<PerformanceMonitor['getMetrics']>; 