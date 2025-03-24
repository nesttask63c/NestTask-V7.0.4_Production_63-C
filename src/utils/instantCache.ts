/**
 * Utility functions for instant caching and instant loading techniques
 */

// Define cache names
const INSTANT_CACHE_NAME = 'instant-data-v1';
const ROUTE_CACHE_NAME = 'route-data-v1';
const API_CACHE_NAME = 'api-data-v1';

/**
 * Cache a network response for instant loading
 * @param url The URL to cache
 * @param response The response to cache
 * @param cacheName The cache name to use
 */
export async function cacheResponse(
  url: string,
  response: Response,
  cacheName: string = INSTANT_CACHE_NAME
): Promise<void> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported in this browser');
    return;
  }
  
  try {
    const cache = await caches.open(cacheName);
    if (response.ok) {
      await cache.put(url, response.clone());
    }
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

/**
 * Retrieve a cached response
 * @param url The URL to fetch from cache
 * @param cacheName The cache name to use
 */
export async function getCachedResponse(
  url: string,
  cacheName: string = INSTANT_CACHE_NAME
): Promise<Response | undefined> {
  if (!('caches' in window)) {
    return undefined;
  }
  
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);
    return cachedResponse;
  } catch (error) {
    console.error('Error retrieving cached response:', error);
    return undefined;
  }
}

/**
 * Fetch with instant cache - tries cache first, then network
 * @param url The URL to fetch
 * @param options Fetch options
 * @param cacheName Cache name to use
 */
export async function fetchWithInstantCache(
  url: string,
  options: RequestInit = {},
  cacheName: string = INSTANT_CACHE_NAME
): Promise<Response> {
  // Try to get from cache first
  const cachedResponse = await getCachedResponse(url, cacheName);
  
  // If we have a cached response, use it
  if (cachedResponse) {
    // In the background, fetch from network and update cache
    updateCacheInBackground(url, options, cacheName);
    return cachedResponse;
  }
  
  // If no cached response, fetch from network
  try {
    const networkResponse = await fetch(url, options);
    
    // Cache the response if it's successful
    if (networkResponse.ok) {
      await cacheResponse(url, networkResponse.clone(), cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    // Handle network errors
    throw new Error(`Failed to fetch: ${error}`);
  }
}

/**
 * Update cache in the background without blocking
 * @param url URL to fetch and cache
 * @param options Fetch options
 * @param cacheName Cache name to use
 */
async function updateCacheInBackground(
  url: string,
  options: RequestInit = {},
  cacheName: string = INSTANT_CACHE_NAME
): Promise<void> {
  try {
    // Get cached response timestamp if available
    let skipUpdate = false;
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      const cacheDate = cachedResponse.headers.get('x-cache-date');
      if (cacheDate) {
        const cacheTime = new Date(cacheDate).getTime();
        const now = Date.now();
        
        // Skip update if cache is less than 5 minutes old
        skipUpdate = (now - cacheTime) < 5 * 60 * 1000;
      }
    }
    
    if (!skipUpdate) {
      const response = await fetch(url, options);
      if (response.ok) {
        // Add a custom header with cache time
        const responseWithDate = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
        });
        
        responseWithDate.headers.set('x-cache-date', new Date().toISOString());
        
        // Update the cache
        await cache.put(url, responseWithDate);
      }
    }
  } catch (error) {
    console.warn('Background cache update failed:', error);
  }
}

/**
 * Clear all instant caches
 */
export async function clearInstantCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }
  
  try {
    await caches.delete(INSTANT_CACHE_NAME);
    await caches.delete(ROUTE_CACHE_NAME);
    await caches.delete(API_CACHE_NAME);
    console.log('Instant caches cleared');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
}

/**
 * Warm up the cache with critical routes
 * @param routes Array of route URLs to cache
 */
export async function warmRouteCache(routes: string[]): Promise<void> {
  if (!navigator.onLine || !('caches' in window)) {
    return;
  }
  
  try {
    const cache = await caches.open(ROUTE_CACHE_NAME);
    
    // Fetch and cache all routes in parallel
    await Promise.all(
      routes.map(async (route) => {
        try {
          const response = await fetch(route);
          if (response.ok) {
            await cache.put(route, response);
          }
        } catch (error) {
          console.warn(`Failed to warm cache for route ${route}:`, error);
        }
      })
    );
    
    console.log(`Warmed route cache with ${routes.length} routes`);
  } catch (error) {
    console.error('Error warming route cache:', error);
  }
} 