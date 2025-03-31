const CACHE_NAME = 'nesttask-v3';
const OFFLINE_URL = '/offline.html';

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

    // Special handling for SPA routes - always serve index.html
    if (event.request.mode === 'navigate') {
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
              return caches.match(OFFLINE_URL);
            })
        );
        return;
      }
    }

    // Check for module scripts
    const isModuleScript = event.request.destination === 'script' && 
                           (url.pathname.endsWith('.mjs') || url.pathname.includes('assets/'));
    
    // For module scripts, ensure proper handling
    if (isModuleScript) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response.ok) {
              // Only cache if response is valid
              const responseClone = response.clone();
              safeCachePut(CACHE_NAME, event.request, responseClone);
            }
            return response;
          })
          .catch(async () => {
            // Fallback to cache
            const cachedResponse = await safeCacheMatch(CACHE_NAME, event.request);
            return cachedResponse || new Response('Module not available', { status: 404 });
          })
      );
      return;
    }

    // Navigation requests (HTML pages) - network first
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Cache the latest version
            const responseClone = response.clone();
            safeCachePut(CACHE_NAME, event.request, responseClone);
            return response;
          })
          .catch(async () => {
            // Offline fallback
            const cachedResponse = await safeCacheMatch(CACHE_NAME, event.request);
            if (cachedResponse) return cachedResponse;
            
            // If no cached version, show offline page
            return safeCacheMatch(CACHE_NAME, OFFLINE_URL);
          })
      );
      return;
    }

    // For runtime-cacheable assets (JS, CSS, images) - stale-while-revalidate
    if (shouldCacheAtRuntime(event.request.url)) {
      event.respondWith(
        (async () => {
          // Try to get from cache first
          const cachedResponse = await safeCacheMatch(CACHE_NAME, event.request);
          
          // Fetch from network in background
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Cache the new version
              safeCachePut(CACHE_NAME, event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              // If fetch fails, return cached or null
              return cachedResponse || null;
            });
            
          // Return cached response immediately, or wait for network
          return cachedResponse || fetchPromise;
        })()
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
            safeCachePut(CACHE_NAME, event.request, responseClone);
          }
          return response;
        })
        .catch(async () => {
          // Try to get from cache
          const cachedResponse = await safeCacheMatch(CACHE_NAME, event.request);
          if (cachedResponse) return cachedResponse;

          // Return error response
          return new Response('Network error', { status: 408 });
        })
    );
  } catch (error) {
    console.error('Error in fetch handler:', error, event.request.url);
    // Let the browser handle this request normally
    return;
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
    console.log('Keep-alive ping received at', new Date(event.data.timestamp).toISOString());
    
    // Respond to the keep-alive to confirm service worker is active
    if (event.source) {
      event.source.postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        timestamp: Date.now()
      });
    }
    
    // Optional: refresh certain caches if needed
    // This helps keep critical data fresh in long offline periods
    if (event.data.reason === 'visibilitychange') {
      console.log('Refreshing critical caches on visibility change');
      
      caches.open(CACHE_NAME).then(cache => {
        // Refresh the main index.html on visibility change
        fetch('/index.html')
          .then(response => {
            if (response.ok) {
              cache.put('/index.html', response);
            }
          })
          .catch(err => console.error('Failed to refresh index.html:', err));
      });
    }
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    console.log('SYNC_NOW message received, attempting immediate sync');
    
    // Verify workbox and queue availability
    if ('workbox' in self && taskQueue && routineQueue && courseTeacherQueue) {
      // Try to perform sync for all queues
      Promise.allSettled([
        taskQueue.replayRequests(),
        routineQueue.replayRequests(), 
        courseTeacherQueue.replayRequests()
      ]).then(results => {
        console.log('Sync attempts completed:', results);
        
        // Notify all clients that sync was attempted
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_NOW_COMPLETED',
              results: results.map(r => r.status)
            });
          });
        });
      });
    } else {
      console.warn('Cannot perform immediate sync: workbox or queues not available');
      if (event.source) {
        event.source.postMessage({
          type: 'SYNC_NOW_ERROR',
          error: 'Background sync not available'
        });
      }
    }
  }
});