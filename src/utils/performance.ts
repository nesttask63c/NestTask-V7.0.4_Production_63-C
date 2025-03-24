// Performance monitoring and optimization utilities
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.debug(`${name} took ${end - start}ms`);
};

// Debounce function for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// RAF-based throttle for smooth animations
export const rafThrottle = <T extends (...args: any[]) => any>(
  fn: T
): ((...args: Parameters<T>) => void) => {
  let ticking = false;
  
  return (...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Intersection Observer hook for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0,
    ...options
  });
};

// Performance metrics tracking
export const trackMetrics = () => {
  if ('performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Report to analytics or monitoring service
        console.debug('[Performance]', entry.name, entry.startTime, entry.duration);
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
  }
};

// Cache API wrapper for response caching
export const cacheResponse = async (
  request: Request,
  response: Response,
  cacheName: string = 'api-cache'
): Promise<void> => {
  if ('caches' in window) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = async () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.debug('Memory Usage:', {
      usedJSHeapSize: memory.usedJSHeapSize / 1048576 + 'MB',
      totalJSHeapSize: memory.totalJSHeapSize / 1048576 + 'MB'
    });
  }
};