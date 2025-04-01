const CACHE_NAME = 'nesttask-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/static/media/logo.png',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients
  self.clients.claim();
});

// Network-first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently (network-only with timeout fallback)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      timeoutNetworkFirst(event.request, 5000)
    );
    return;
  }

  // For navigation requests (HTML pages), use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return from cache and update cache in background
          fetchAndUpdateCache(event.request);
          return cachedResponse;
        }
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the fetched response
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // For image requests, you could return a placeholder
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/static/media/placeholder.png');
            }
          });
      })
  );
});

// Function to fetch and update cache in background
function fetchAndUpdateCache(request) {
  fetch(request)
    .then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
      }
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response);
      });
    })
    .catch(error => {
      console.log('Background fetch failed:', error);
    });
}

// Network request with timeout
function timeoutNetworkFirst(request, timeout) {
  return new Promise(resolve => {
    let timeoutId;
    
    // Set timeout for network request
    const timeoutPromise = new Promise(resolveTimeout => {
      timeoutId = setTimeout(() => {
        // Check cache if timeout occurs
        caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('Timeout, serving from cache:', request.url);
            resolveTimeout(cachedResponse);
          } else {
            console.log('No cached data available after timeout');
            // If API request fails and no cache, return empty JSON with offline flag
            resolveTimeout(new Response(JSON.stringify({ 
              offline: true, 
              message: 'You are offline. Some data may not be available.' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        });
      }, timeout);
    });
    
    // Try network request
    const fetchPromise = fetch(request).then(response => {
      clearTimeout(timeoutId);
      
      // Cache the response for future offline use
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseClone);
      });
      
      return response;
    }).catch(error => {
      clearTimeout(timeoutId);
      console.error('Network fetch failed:', error);
      
      // Try to get from cache
      return caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Return offline JSON response
        return new Response(JSON.stringify({ 
          offline: true, 
          message: 'You are offline. Some data may not be available.' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });
    
    // Race between timeout and fetch
    Promise.race([fetchPromise, timeoutPromise])
      .then(response => resolve(response));
  });
}

// Listen for the 'message' event to handle cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle manual cache refresh
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(urlsToCache);
        })
        .then(() => {
          console.log('Cache refreshed successfully');
          // Notify clients that cache was updated
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'CACHE_UPDATED',
                timestamp: new Date().getTime()
              });
            });
          });
        })
    );
  }
});

// Periodic cache validation - check every 30 minutes if the app is open
setInterval(() => {
  self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      console.log('Validating cache contents');
      caches.open(CACHE_NAME).then(cache => {
        // Refresh critical resources
        urlsToCache.forEach(url => {
          fetch(url, { cache: 'no-store' })
            .then(response => {
              if (response.ok) {
                cache.put(url, response);
              }
            })
            .catch(err => console.log('Failed to refresh cache for:', url, err));
        });
      });
    }
  });
}, 30 * 60 * 1000); // 30 minutes