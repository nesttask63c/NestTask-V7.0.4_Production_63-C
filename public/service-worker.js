const CACHE_NAME = 'nesttask-v3';
const OFFLINE_URL = '/offline.html';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/add-task.png',
  '/icons/view-tasks.png',
  '/icons/badge.png',
  // Add core app routes HTML
  '/home',
  '/upcoming',
  '/search',
  '/routine',
  '/courses',
  '/profile'
];

// Dynamic assets that should be cached during runtime
const RUNTIME_CACHE_PATTERNS = [
  /\.(js|css)$/, // JS and CSS files
  /assets\/.*\.(js|css|woff2|png|jpg|svg)$/, // Vite build assets
  /\/icons\/.*\.png$/, // Icon images
  /^https:\/\/fonts\.googleapis\.com/, // Google fonts stylesheets
  /^https:\/\/fonts\.gstatic\.com/ // Google fonts files
];

// Create sync queues for different operations
let taskQueue, routineQueue, courseTeacherQueue;

// Initialize background sync if supported
function initBackgroundSync() {
  if ('sync' in self.registration) {
    // Create queues for different types of operations
    taskQueue = new workbox.backgroundSync.Queue('taskQueue', {
      maxRetentionTime: 7 * 24 * 60 // Retry for up to 7 days (in minutes) - Increased from 24 hours
    });
    
    routineQueue = new workbox.backgroundSync.Queue('routineQueue', {
      maxRetentionTime: 7 * 24 * 60 // Retry for up to 7 days - Increased from 24 hours
    });
    
    courseTeacherQueue = new workbox.backgroundSync.Queue('courseTeacherQueue', {
      maxRetentionTime: 7 * 24 * 60 // Retry for up to 7 days - Increased from 24 hours
    });
    
    console.log('Background sync initialized');
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell and static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
  
  // Initialize background sync if available
  if ('workbox' in self) {
    try {
      initBackgroundSync();
    } catch (error) {
      console.error('Error initializing background sync:', error);
    }
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Helper function to determine if a URL should be cached at runtime
function shouldCacheAtRuntime(url) {
  try {
    // Skip unsupported URL schemes
    const urlObj = new URL(url);
    if (urlObj.protocol === 'chrome-extension:' || 
        urlObj.protocol === 'chrome:' ||
        urlObj.protocol === 'edge:' ||
        urlObj.protocol === 'brave:' ||
        urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Don't cache Supabase API requests
    if (url.includes('supabase.co')) {
      return false;
    }
    
    // Check if the URL matches any of our patterns
    return RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url));
  } catch (error) {
    console.error('Error checking URL for caching:', error, url);
    return false;
  }
}

// SPA Routes to handle with the app router
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

// Fetch event - stale-while-revalidate strategy for assets, network-first for API
self.addEventListener('fetch', (event) => {
  // Handle non-GET requests with background sync for offline support
  if (event.request.method !== 'GET') {
    // Process API requests for background sync when offline
    if (
      event.request.url.includes('/api/tasks') || 
      event.request.url.includes('/api/routines') || 
      event.request.url.includes('/api/courses') || 
      event.request.url.includes('/api/teachers')
    ) {
      // Only use background sync if offline and queues are available
      if (!self.navigator.onLine && 'workbox' in self) {
        const url = new URL(event.request.url);
        
        // Choose the appropriate queue based on the API endpoint
        let queue;
        if (url.pathname.includes('/tasks')) {
          queue = taskQueue;
        } else if (url.pathname.includes('/routines')) {
          queue = routineQueue;
        } else if (url.pathname.includes('/courses') || url.pathname.includes('/teachers')) {
          queue = courseTeacherQueue;
        }
        
        // Add to queue if available
        if (queue) {
          event.respondWith(
            fetch(event.request.clone())
              .catch((error) => {
                console.log('Queuing failed request for background sync', error);
                queue.pushRequest({ request: event.request });
                return new Response(JSON.stringify({ 
                  status: 'queued',
                  message: 'Request queued for background sync'
                }), {
                  headers: { 'Content-Type': 'application/json' },
                  status: 202
                });
              })
          );
          return;
        }
      }
    }
    
    // For other non-GET requests, proceed normally
    return;
  }

  try {
    const url = new URL(event.request.url);

    // Skip unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'edge:' ||
        url.protocol === 'brave:' ||
        url.protocol !== 'http:' && url.protocol !== 'https:') {
      return;
    }

    // Skip Supabase API requests (let them go to network)
    if (url.hostname.includes('supabase.co')) {
      return;
    }

    // Handle API requests with special caching
    if (url.pathname.includes('/api/')) {
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // Return cached API response immediately when offline
              if (!navigator.onLine) {
                return cachedResponse;
              }
              
              // When online, try network first, fall back to cache
              return fetch(event.request)
                .then(networkResponse => {
                  // Cache the updated response
                  if (networkResponse.ok) {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => cache.put(event.request, clonedResponse));
                  }
                  return networkResponse;
                })
                .catch(() => cachedResponse);
            }
            
            // No cache, try network
            return fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  const clonedResponse = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, clonedResponse));
                }
                return networkResponse;
              });
          })
      );
      return;
    }

    // Improved app shell handling for navigation requests with robust offline fallback
    if (event.request.mode === 'navigate') {
      event.respondWith(
        (async () => {
          try {
            // For navigation, try network first when online
            if (navigator.onLine) {
              try {
                const networkResponse = await fetch(event.request);
                if (networkResponse.ok) {
                  // Cache the successful navigation response
                  const cache = await caches.open(CACHE_NAME);
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                }
              } catch (error) {
                console.log('Navigation fetch failed, falling back to cache', error);
              }
            }
            
            // If offline or network request failed, try cache
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache, try cached index.html for SPA routes
            const isSpaRoute = SPA_ROUTES.some(route => 
              url.pathname === route || url.pathname.startsWith(`${route}/`)
            );
            
            if (isSpaRoute || url.pathname === '/') {
              const indexHtmlResponse = await caches.match('/index.html');
              if (indexHtmlResponse) {
                return indexHtmlResponse;
              }
            }
            
            // If all else fails, show the offline page
            return caches.match(OFFLINE_URL);
          } catch (error) {
            console.error('Navigation error handler:', error);
            return caches.match(OFFLINE_URL);
          }
        })()
      );
      return;
    }

    // For other assets (JS, CSS, images, etc.) - check cache first
    if (shouldCacheAtRuntime(event.request.url) || 
        event.request.destination === 'script' || 
        event.request.destination === 'style' || 
        event.request.destination === 'image') {
      
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // Return cached version and update cache in background
              const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                  if (networkResponse.ok) {
                    const cache = caches.open(CACHE_NAME)
                      .then(cache => cache.put(event.request, networkResponse.clone()));
                  }
                  return networkResponse;
                })
                .catch(() => { /* Ignore fetch errors when we have cached version */ });
              
              // Return cached response immediately
              return cachedResponse;
            }
            
            // If no cached version, try network
            return fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  // Cache for next time
                  const responseToCache = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseToCache));
                }
                return networkResponse;
              })
              .catch(() => {
                // If fetch fails and it's an image, return fallback image
                if (event.request.destination === 'image') {
                  return new Response('', { status: 404 });
                }
                return new Response('Network error', { status: 408 });
              });
          })
      );
      return;
    }

    // For all other requests - network first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses that match patterns
          if (response.ok && shouldCacheAtRuntime(event.request.url)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Try to get from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          // Return error response
          return new Response('Network error', { status: 408 });
        })
    );
  } catch (error) {
    console.error('Error in fetch handler:', error);
    
    // Last resort offline fallback
    if (event.request.mode === 'navigate') {
      event.respondWith(caches.match(OFFLINE_URL));
    }
  }
});

// Handle sync events for background data synchronization
self.addEventListener('sync', (event) => {
  console.log('Sync event received:', event.tag);
  
  if (!('workbox' in self)) {
    console.log('Workbox not available for background sync');
    return;
  }
  
  if (event.tag === 'taskSync' && taskQueue) {
    event.waitUntil(taskQueue.replayRequests().then(() => {
      // Notify clients that sync is complete
      notifyClientsOfSync('task');
    }));
  } else if (event.tag === 'routineSync' && routineQueue) {
    event.waitUntil(routineQueue.replayRequests().then(() => {
      notifyClientsOfSync('routine');
    }));
  } else if (event.tag === 'courseTeacherSync' && courseTeacherQueue) {
    event.waitUntil(courseTeacherQueue.replayRequests().then(() => {
      notifyClientsOfSync('courseTeacher');
    }));
  }
});

// Helper function to notify clients of sync completion
function notifyClientsOfSync(category) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETED',
        category: category
      });
    });
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || '/',
        taskId: data.data?.taskId,
        type: data.data?.type
      },
      actions: data.actions || [
        {
          action: 'open',
          title: 'Open',
          icon: '/icons/icon-192x192.png'
        }
      ],
      tag: data.tag || 'default',
      renotify: true,
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  const taskId = event.notification.data?.taskId;
  const notificationType = event.notification.data?.type;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        const hadWindowToFocus = windowClients.some((windowClient) => {
          if (windowClient.url === urlToOpen) {
            // Focus if already open
            windowClient.focus();
            // Send message to client to handle the notification action
            if (taskId) {
              windowClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                taskId: taskId,
                notificationType: notificationType
              });
            }
            return true;
          }
          return false;
        });

        // If no window with target URL, open a new one
        if (!hadWindowToFocus) {
          return clients.openWindow(urlToOpen).then((windowClient) => {
            // Send message to newly opened client after a short delay
            // to ensure the app has loaded
            if (windowClient && taskId) {
              setTimeout(() => {
                windowClient.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  taskId: taskId,
                  notificationType: notificationType
                });
              }, 1000);
            }
          });
        }
      })
  );
});

// Helper function to safely put items in cache
async function safeCachePut(cacheName, request, response) {
  try {
    // Clone the response to avoid consuming it
    const responseToCache = response.clone();
    
    // Only cache valid responses
    if (!responseToCache || responseToCache.status !== 200) {
      return;
    }
    
    const cache = await caches.open(cacheName);
    await cache.put(request, responseToCache);
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

// Helper function to safely match items in cache
async function safeCacheMatch(cacheName, request) {
  try {
    const cache = await caches.open(cacheName);
    return await cache.match(request);
  } catch (error) {
    console.error('Error matching cache:', error);
    return null;
  }
}

// Add a message handler for keep-alive pings
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    // When receiving keep-alive, check cache health
    event.waitUntil(validateCacheHealth());
  }
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    // Trigger sync immediately upon reconnection
    event.waitUntil(
      (async () => {
        if ('sync' in self.registration) {
          try {
            await self.registration.sync.register('taskSync');
            await self.registration.sync.register('routineSync');
            await self.registration.sync.register('courseTeacherSync');
            
            // Notify clients that sync has been triggered
            notifyClientsOfSync('all');
          } catch (error) {
            console.error('Error registering sync on reconnection:', error);
          }
        }
      })()
    );
  }
  
  if (event.data && event.data.type === 'CLAIM_CLIENTS') {
    console.log('Received request to claim clients');
    event.waitUntil(
      self.clients.claim()
        .then(() => {
          console.log('Clients claimed successfully');
          // Respond to the client
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              type: 'CLAIMING_CLIENTS',
              success: true
            });
          }
        })
        .catch(error => {
          console.error('Error claiming clients:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              type: 'CLAIMING_CLIENTS',
              success: false,
              error: error.message
            });
          }
        })
    );
  }
});

// Validate and fix cache health
async function validateCacheHealth() {
  try {
    // Check if the offline page is cached
    const offlineCache = await caches.match(OFFLINE_URL);
    if (!offlineCache) {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(OFFLINE_URL);
      console.log('Restored missing offline page');
    }
    
    // Check if app shell is cached
    const indexCache = await caches.match('/index.html');
    if (!indexCache) {
      const cache = await caches.open(CACHE_NAME);
      await cache.add('/index.html');
      console.log('Restored missing index.html');
    }
    
    // Check and refresh old cache entries
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const headers = response.headers;
        const dateHeader = headers.get('date');
        
        if (dateHeader) {
          const cacheDate = new Date(dateHeader).getTime();
          if (now - cacheDate > MAX_CACHE_AGE) {
            // Try to refresh stale cache entry if online
            try {
              if (navigator.onLine) {
                const freshResponse = await fetch(request, { cache: 'reload' });
                if (freshResponse.ok) {
                  await cache.put(request, freshResponse);
                  console.log('Refreshed stale cache entry:', request.url);
                }
              }
            } catch (error) {
              console.log('Could not refresh stale cache entry:', error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error validating cache health:', error);
  }
}