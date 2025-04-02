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

// Store last activity timestamp to track service worker lifecycle
let lastActivityTime = Date.now();

// Update the activity timestamp for service worker
function updateActivityTimestamp() {
  lastActivityTime = Date.now();
  // Store the timestamp in cache to persist across service worker restarts
  try {
    if (caches) {
      caches.open('sw-metadata').then(cache => {
        cache.put('lastActivityTime', new Response(JSON.stringify({ timestamp: lastActivityTime })));
      });
    }
  } catch (e) {
    console.error('Error storing activity timestamp:', e);
  }
}

// Check if the service worker has been inactive for too long
async function checkServiceWorkerInactivity() {
  try {
    if (caches) {
      const cache = await caches.open('sw-metadata');
      const response = await cache.match('lastActivityTime');
      
      if (response) {
        const data = await response.json();
        const inactiveTime = Date.now() - data.timestamp;
        
        // If inactive for more than 45 minutes, update to keep alive
        if (inactiveTime > 45 * 60 * 1000) {
          console.log('Service worker has been inactive for too long. Refreshing timestamp.');
          updateActivityTimestamp();
        }
      }
    }
  } catch (e) {
    console.error('Error checking inactivity:', e);
  }
}

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
  
  // Initialize activity timestamp
  updateActivityTimestamp();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== 'sw-metadata')
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  
  // Set up periodic activity check
  setInterval(checkServiceWorkerInactivity, 15 * 60 * 1000); // Check every 15 minutes
  
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
  // Update activity timestamp on fetch events
  updateActivityTimestamp();
  
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
            console.log(`Network request failed for navigation: ${event.request.url}, trying cache`);
            
            // Try to get from cache - first the exact URL
            const cachedResponse = await safeCacheMatch(CACHE_NAME, event.request);
            
            if (cachedResponse) {
              console.log(`Found cached response for: ${event.request.url}`);
              return cachedResponse;
            }
            
            // If not in cache, try index.html for SPA routes
            console.log(`No cache for: ${event.request.url}, trying index.html`);
            const indexResponse = await safeCacheMatch(CACHE_NAME, new Request('/index.html'));
            
            if (indexResponse) {
              console.log('Serving index.html as fallback');
              return indexResponse;
            }
            
            // As a last resort, serve offline page
            console.log('Serving offline page as last resort');
            const offlineResponse = await safeCacheMatch(CACHE_NAME, new Request(OFFLINE_URL));
            return offlineResponse || new Response('Offline page not available', {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            });
          })
      );
      return;
    }

    // For assets that should be cached
    if (shouldCacheAtRuntime(event.request.url)) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(() => {
                console.log(`Serving cached version of ${event.request.url}`);
                return new Response('Content not available offline', { status: 404 });
              });

            // Return the cached response if we have it, otherwise wait for the network response
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }
  } catch (error) {
    console.error('Error in fetch handler:', error);
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
    if (!response || !response.body) {
      console.warn('Cannot cache invalid response for', request.url);
      return;
    }
    
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    console.error('Cache put error for', request.url, error);
  }
}

// Helper function to safely match items in cache
async function safeCacheMatch(cacheName, request) {
  try {
    const cache = await caches.open(cacheName);
    return cache.match(request);
  } catch (error) {
    console.error('Cache match error for', request.url, error);
    return null;
  }
}

// Add a message handler for keep-alive pings
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    console.log('Keep-alive ping received at', new Date(event.data.timestamp).toISOString());
    
    // Update activity timestamp
    updateActivityTimestamp();
    
    // Respond to the keep-alive to confirm service worker is active
    if (event.source) {
      event.source.postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        timestamp: Date.now()
      });
    }
  } else if (event.data && event.data.type === 'SYNC_NOW') {
    console.log('SYNC_NOW message received, attempting immediate sync');
    
    // Update activity timestamp
    updateActivityTimestamp();
    
    // Try to perform sync for all queues
    if ('workbox' in self) {
      try {
        taskQueue.replayRequests();
        routineQueue.replayRequests();
        courseTeacherQueue.replayRequests();
        
        // Notify client that sync was attempted
        if (event.source) {
          event.source.postMessage({
            type: 'SYNC_NOW_COMPLETED',
            success: true
          });
        }
      } catch (error) {
        console.error('Error replaying queued requests:', error);
        
        if (event.source) {
          event.source.postMessage({
            type: 'SYNC_NOW_COMPLETED',
            success: false,
            error: error.message
          });
        }
      }
    }
  } else if (event.data && event.data.type === 'HEALTH_CHECK') {
    console.log('Health check request received');
    
    // Update activity timestamp
    updateActivityTimestamp();
    
    // Respond to confirm the service worker is healthy
    if (event.source) {
      event.source.postMessage({
        type: 'HEALTH_CHECK_RESPONSE',
        timestamp: Date.now(),
        status: 'healthy'
      });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Skip waiting requested, activating service worker immediately');
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLAIM_CLIENTS') {
    console.log('Claim clients requested, claiming all clients');
    self.clients.claim();
    
    // Notify clients that they've been claimed
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CLAIMED_BY_SERVICE_WORKER',
          timestamp: Date.now()
        });
      });
    });
  }
});

// Self-healing: Attempt to recover from critical errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
  
  // Log the error and update activity timestamp to keep the worker alive
  updateActivityTimestamp();
});

// Keep track of unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  
  // Log the error and update activity timestamp to keep the worker alive
  updateActivityTimestamp();
});

// Set up a periodic ping to keep the service worker alive
setInterval(() => {
  updateActivityTimestamp();
  console.log('Self-ping to keep service worker alive at', new Date().toISOString());
}, 20 * 60 * 1000); // Ping every 20 minutes