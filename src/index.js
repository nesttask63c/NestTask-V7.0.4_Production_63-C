// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates every hour if the page is open
        setInterval(() => {
          registration.update()
            .then(() => console.log('Service worker update check completed'))
            .catch(err => console.error('Service worker update check failed:', err));
        }, 60 * 60 * 1000); // 1 hour interval
        
        // Handle new service worker installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker state:', newWorker.state);
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
    // Handle offline/online status changes
    window.addEventListener('online', () => {
      console.log('App is back online');
      // Force refresh cache when back online
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REFRESH_CACHE'
        });
      }
      
      // Sync IndexedDB with server if needed
      syncDataWithServer();
      
      // Notify user
      displayNetworkStatus(true);
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline');
      displayNetworkStatus(false);
    });
  });
}

// Function to update the IndexedDB with lastSync timestamp
function updateLastSyncTimestamp() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('nesttask-db', 1);
    
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'id' });
      }
    };
    
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('metadata', 'readwrite');
      const store = transaction.objectStore('metadata');
      
      store.put({
        id: 'lastSync',
        timestamp: Date.now()
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (error) => reject(error);
    };
    
    openRequest.onerror = (error) => reject(error);
  });
}

// Function to sync data with server when back online
function syncDataWithServer() {
  // Implement your data synchronization logic here
  // Example: Syncing pending changes from IndexedDB to server
  console.log('Syncing data with server...');
  
  // After successful sync, update the last sync timestamp
  updateLastSyncTimestamp()
    .then(() => console.log('Last sync timestamp updated'))
    .catch(err => console.error('Failed to update last sync timestamp:', err));
}

// Function to display network status to the user
function displayNetworkStatus(isOnline) {
  // Create or update the network status notification
  let networkStatusElement = document.getElementById('network-status-notification');
  
  if (!networkStatusElement) {
    networkStatusElement = document.createElement('div');
    networkStatusElement.id = 'network-status-notification';
    networkStatusElement.style.position = 'fixed';
    networkStatusElement.style.bottom = '20px';
    networkStatusElement.style.right = '20px';
    networkStatusElement.style.padding = '10px 20px';
    networkStatusElement.style.borderRadius = '4px';
    networkStatusElement.style.color = 'white';
    networkStatusElement.style.fontWeight = 'bold';
    networkStatusElement.style.zIndex = '9999';
    networkStatusElement.style.transition = 'opacity 0.5s ease-in-out';
    document.body.appendChild(networkStatusElement);
  }
  
  if (isOnline) {
    networkStatusElement.textContent = '✅ You are back online';
    networkStatusElement.style.backgroundColor = '#4caf50';
    
    // Fade out after 5 seconds
    setTimeout(() => {
      networkStatusElement.style.opacity = '0';
      setTimeout(() => {
        if (networkStatusElement.parentNode) {
          networkStatusElement.parentNode.removeChild(networkStatusElement);
        }
      }, 500);
    }, 5000);
  } else {
    networkStatusElement.textContent = '⚠️ You are offline';
    networkStatusElement.style.backgroundColor = '#ff9800';
    networkStatusElement.style.opacity = '1';
  }
}

// Initialize the IndexedDB database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('nesttask-db', 1);
    
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'id' });
      }
      
      // Add other object stores needed for offline data
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('teachers')) {
        db.createObjectStore('teachers', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('students')) {
        db.createObjectStore('students', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('courses')) {
        db.createObjectStore('courses', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingOperations')) {
        db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    openRequest.onsuccess = () => {
      console.log('IndexedDB initialized successfully');
      resolve();
    };
    
    openRequest.onerror = (error) => {
      console.error('Failed to initialize IndexedDB:', error);
      reject(error);
    };
  });
}

// Initialize app
(async function() {
  try {
    await initializeDatabase();
    
    // Update last sync timestamp on initial load if online
    if (navigator.onLine) {
      await updateLastSyncTimestamp();
    }
    
    // Set initial network status
    displayNetworkStatus(navigator.onLine);
    
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
})();

// Check if we're getting back after offline period
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  // Request fresh data from the network
  navigator.serviceWorker.controller.postMessage({
    type: 'REFRESH_CACHE'
  });
} 