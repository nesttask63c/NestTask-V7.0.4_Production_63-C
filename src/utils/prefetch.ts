import { supabase } from '../lib/supabase';
import { STORES, saveToIndexedDB } from './offlineStorage';
import { lazyLoad, preloadComponent } from './lazyLoad';

// Type for prefetch options
export interface PrefetchOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  keepAlive?: boolean;
  forceCache?: boolean; // Add option to force caching even when offline
}

// Map to track which routes have been prefetched to avoid duplicate work
const prefetchedRoutes = new Map<string, boolean>();
const prefetchedQueries = new Map<string, boolean>();

/**
 * Prefetch a specific route
 * @param importFn The import function for the component
 * @param routeKey A unique key to identify this route
 */
export const prefetchRoute = (importFn: () => Promise<any>, routeKey: string) => {
  if (prefetchedRoutes.has(routeKey)) return;

  // Mark as prefetched immediately to prevent duplicate requests
  prefetchedRoutes.set(routeKey, true);
  preloadComponent(importFn)();
};

/**
 * Prefetch API data and store in cache
 * @param tableName Supabase table name
 * @param queryFn Function that returns the Supabase query
 * @param cacheKey Unique key for this query
 * @param storeName IndexedDB store name
 * @param options Prefetch options
 */
export const prefetchApiData = async (
  tableName: string,
  queryFn: (query: any) => any,
  cacheKey: string,
  storeName: string = STORES.USER_DATA,
  options: PrefetchOptions = {}
) => {
  // Skip if already prefetched or if we're offline and not forcing cache
  if (prefetchedQueries.has(cacheKey) && !options.forceCache) return;
  if (!navigator.onLine && !options.forceCache) return;
  
  // Mark as prefetched immediately to prevent duplicate requests
  prefetchedQueries.set(cacheKey, true);
  
  try {
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set timeout if specified
    if (options.timeout) {
      setTimeout(() => controller.abort(), options.timeout);
    }
    
    // Set priority hint using the new fetch API's priority option
    const query = supabase.from(tableName);
    const queryWithOptions = queryFn(query);
    
    // Execute the query with high priority
    const { data, error } = await queryWithOptions;
    
    if (error) {
      console.error(`Prefetch error for ${cacheKey}:`, error);
      return;
    }
    
    if (data) {
      // Save to IndexedDB for offline access
      await saveToIndexedDB(storeName, data);
      
      // Store in memory cache
      const timestamp = new Date().toISOString();
      await saveToIndexedDB(STORES.USER_DATA, { 
        id: `${cacheKey}_timestamp`, 
        value: timestamp 
      });
      
      console.debug(`Prefetched and cached ${data.length || 0} items for ${cacheKey}`);
      return data;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.debug(`Prefetch aborted for ${cacheKey}`);
    } else {
      console.error(`Prefetch failed for ${cacheKey}:`, err);
    }
    
    // Remove from prefetched queries if it failed
    prefetchedQueries.delete(cacheKey);
    return null;
  }
};

/**
 * Alternative way to prefetch API data using a loader object
 * @param options Object containing loader and options
 */
export const prefetchApiDataWithLoader = async (options: {
  loader: {
    tableName: string;
    queryFn: (query: any) => any;
    storeName: string;
  };
  options?: PrefetchOptions;
  key: string;
}) => {
  const { tableName, queryFn, storeName } = options.loader;
  const { forceCache = false } = options.options || {};
  
  return prefetchApiData(
    tableName,
    queryFn,
    options.key,
    storeName,
    { ...options.options, forceCache }
  );
};

/**
 * Prefetch multiple resources in parallel with priority
 * @param resources Array of resources to prefetch
 */
export const prefetchResources = async (resources: Array<{
  type: 'route' | 'api' | 'asset';
  key: string;
  loader: any;
  options?: PrefetchOptions;
}>) => {
  // Sort by priority (high first)
  const sortedResources = [...resources].sort((a, b) => {
    const priorityMap = { 'high': 2, 'medium': 1, 'low': 0 };
    const aPriority = priorityMap[a.options?.priority || 'low'];
    const bPriority = priorityMap[b.options?.priority || 'low'];
    return bPriority - aPriority;
  });
  
  // Prefetch high priority resources immediately
  const highPriorityResources = sortedResources.filter(r => r.options?.priority === 'high');
  
  // Prefetch high priority resources immediately
  highPriorityResources.forEach(resource => {
    if (resource.type === 'route') {
      prefetchRoute(resource.loader, resource.key);
    } else if (resource.type === 'api' && resource.loader) {
      if (typeof resource.loader === 'object' && resource.loader.tableName && resource.loader.queryFn) {
        prefetchApiDataWithLoader({
          loader: resource.loader,
          options: resource.options,
          key: resource.key
        });
      } else {
        const { tableName, queryFn, storeName } = resource.loader;
        prefetchApiData(tableName, queryFn, resource.key, storeName, resource.options);
      }
    } else if (resource.type === 'asset' && typeof resource.loader === 'string') {
      prefetchAsset(resource.loader);
    }
  });
  
  // Prefetch low priority resources during idle time
  if ('requestIdleCallback' in window) {
    const lowPriorityResources = sortedResources.filter(r => r.options?.priority !== 'high');
    
    (window as any).requestIdleCallback(() => {
      lowPriorityResources.forEach(resource => {
        if (resource.type === 'route') {
          prefetchRoute(resource.loader, resource.key);
        } else if (resource.type === 'api' && resource.loader) {
          if (typeof resource.loader === 'object' && resource.loader.tableName && resource.loader.queryFn) {
            prefetchApiDataWithLoader({
              loader: resource.loader,
              options: resource.options,
              key: resource.key
            });
          } else {
            const { tableName, queryFn, storeName } = resource.loader;
            prefetchApiData(tableName, queryFn, resource.key, storeName, resource.options);
          }
        } else if (resource.type === 'asset' && typeof resource.loader === 'string') {
          prefetchAsset(resource.loader);
        }
      });
    }, { timeout: 2000 });
  }
};

/**
 * Prefetch an asset (image, CSS, etc.)
 * @param url The URL of the asset to prefetch
 */
export const prefetchAsset = (url: string) => {
  if (!url || !navigator.onLine) return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = url.endsWith('.css') ? 'style' : 
            url.endsWith('.js') ? 'script' : 
            url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/) ? 'image' : 
            'fetch';
  
  document.head.appendChild(link);
};

/**
 * Clear prefetch cache to avoid outdated data
 */
export const clearPrefetchCache = () => {
  prefetchedRoutes.clear();
  prefetchedQueries.clear();
}; 