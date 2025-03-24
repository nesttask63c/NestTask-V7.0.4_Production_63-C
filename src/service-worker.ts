// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { registerRoute, NavigationRoute, Route } from 'workbox-routing';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ExpirationPlugin } from 'workbox-expiration';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { warmStrategyCache } from 'workbox-recipes';

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache all assets generated by your build process
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Add a utility function at the beginning of the file 
// to safely check if a URL can be cached
function isValidCacheURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    return validProtocols.includes(urlObj.protocol);
  } catch (e) {
    console.error('Invalid URL:', url, e);
    return false;
  }
}

// Define URLs to preload/warm up cache
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Cache critical static assets with a Cache First strategy
const staticAssetsStrategy = new CacheFirst({
  cacheName: 'static-assets-v2',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxEntries: 150,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      purgeOnQuotaError: true // Delete old entries when cache is full
    }),
  ],
});

// Warm up the cache with critical assets
warmStrategyCache({
  urls: URLS_TO_CACHE,
  strategy: staticAssetsStrategy
});

// Cache images with a Cache First strategy
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ request, url }: { request: any, url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return request.destination === 'image';
  },
  new CacheFirst({
    cacheName: 'images-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache CSS and JavaScript with a Stale While Revalidate strategy
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ request, url }: { request: any, url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return request.destination === 'script' ||
           request.destination === 'style';
  },
  new StaleWhileRevalidate({
    cacheName: 'static-resources-v2',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
    ],
  })
);

// Optimized caching for fonts to improve load time
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ request, url }: { request: any, url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return request.destination === 'font' || 
           url.origin.includes('fonts.googleapis.com') ||
           url.origin.includes('fonts.gstatic.com');
  },
  new CacheFirst({
    cacheName: 'fonts-v2',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30, 
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
    ],
  })
);

// Enhanced caching for critical pages - improved implementation
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    
    // Cache Home, Upcoming, Search, and Routine page routes
    return url.pathname === '/' || 
           url.pathname === '/upcoming' || 
           url.pathname === '/search' ||
           url.pathname === '/routine' || 
           url.pathname.startsWith('/static/');
  },
  new NetworkFirst({
    cacheName: 'app-pages-v2',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
    ],
  })
);

// Cache API calls with a Network First strategy
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return url.pathname.startsWith('/api/');
  },
  new NetworkFirst({
    cacheName: 'api-responses-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
    ],
  })
);

// Enhanced cache for critical data used in Home, Upcoming, Search, and Routine pages
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    } 
    return url.pathname.includes('/task') || 
           url.pathname.includes('/routine') || 
           url.pathname.includes('/user') ||
           url.pathname.includes('/course') ||
           url.pathname.includes('/teacher');
  },
  new NetworkFirst({
    cacheName: 'app-data-v2',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 12 * 60 * 60, // 12 hours
        purgeOnQuotaError: true // Delete old entries when cache is full
      }),
    ],
  })
);

// Handle offline fallback
const OFFLINE_PAGE = '/offline.html';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('install', (event: any) => {
  // Skip waiting to activate the new service worker immediately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).skipWaiting();
  
  event.waitUntil(
    caches.open('offline-cache-v2').then((cache) => {
      return cache.add(OFFLINE_PAGE);
    })
  );
});

// Claim clients to take control immediately
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('activate', (event: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event.waitUntil((self as any).clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete any old version caches (those that don't end with -v2)
            return !cacheName.endsWith('-v2') && 
                  (cacheName.startsWith('static-') || 
                   cacheName.startsWith('images-') || 
                   cacheName.startsWith('app-'));
          })
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// SPA Routes that should be handled by the app's router
const SPA_ROUTES = [
  '/home',
  '/upcoming',
  '/search',
  '/notifications',
  '/courses',
  '/study-materials',
  '/routine',
  '/admin',
  '/settings',
  '/profile',
];

// Improved fetch event handling with specific SPA route support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('fetch', (event: any) => {
  // Skip cross-origin requests and unsupported URL schemes
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('chrome://') ||
      event.request.url.startsWith('edge://') ||
      event.request.url.startsWith('brave://') ||
      !isValidCacheURL(event.request.url)) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    // Special handling for SPA routes - always serve index.html
    const isSpaRoute = SPA_ROUTES.some(route => 
      url.pathname === route || url.pathname.startsWith(`${route}/`)
    );
    
    if (isSpaRoute) {
      event.respondWith(
        caches.match('/index.html')
          .then(response => {
            if (response) {
              return response;
            }
            return fetch('/index.html');
          })
          .catch(() => {
            return caches.match(OFFLINE_PAGE);
          })
      );
      return;
    }
    
    event.respondWith(
      (async () => {
        try {
          // Try to perform a normal navigation
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Try the network first for navigation
          const networkResponse = await fetch(event.request);
          // Save successful responses in cache
          const cache = await caches.open('app-pages-v2');
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // If network fails, try to get the page from cache
          const cache = await caches.open('app-pages-v2');
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // If the page isn't in cache, return the offline page
          const offlineCache = await caches.open('offline-cache-v2');
          const offlineResponse = await offlineCache.match(OFFLINE_PAGE);
          return offlineResponse;
        }
      })()
    );
  }
});

// Background sync for offline operations
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('offlineQueue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 Hours
});

// Updated API routes for tasks, routines, courses, etc. to use background sync
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return url.pathname.match(/\/api\/(tasks|routines|courses|teachers).*/);
  },
  new NetworkFirst({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Also handle PUT and DELETE requests for tasks and routines
registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return url.pathname.match(/\/api\/(tasks|routines).*/);
  },
  new NetworkFirst({
    plugins: [bgSyncPlugin]
  }),
  'PUT'
);

registerRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ url }: { url: any }) => {
    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:') {
      return false;
    }
    return url.pathname.match(/\/api\/(tasks|routines).*/);
  },
  new NetworkFirst({
    plugins: [bgSyncPlugin]
  }),
  'DELETE'
);

// Add a global error handler to catch unexpected errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Add an unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});