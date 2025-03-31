// Check if the app can be installed
export function checkInstallability() {
  if ('BeforeInstallPromptEvent' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
    });
  }
}

// Request to install the PWA
export async function installPWA() {
  const deferredPrompt = (window as any).deferredPrompt;
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  // Clear the stored prompt
  (window as any).deferredPrompt = null;
  
  return outcome === 'accepted';
}

// Register for push notifications
export async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
    });
    
    return subscription;
  } catch (error) {
    console.error('Failed to register push notifications:', error);
    return null;
  }
}

// Track service worker registration state
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

// Register service worker for offline support with optimized handling
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  
  // Use cached registration if available
  if (serviceWorkerRegistration) return serviceWorkerRegistration;
  
  try {
    // Check if service worker is already registered
    const registrations = await navigator.serviceWorker.getRegistrations();
    const existingRegistration = registrations.find(reg => reg.active && reg.scope.includes(window.location.origin));
    
    if (existingRegistration) {
      serviceWorkerRegistration = existingRegistration;
      console.log('Using existing service worker registration');
      
      // Set up update handler
      setupUpdateHandler(existingRegistration);
      
      // Force client claim to ensure we're controlled
      if (existingRegistration.active && !navigator.serviceWorker.controller) {
        // Create a message channel to communicate with the service worker
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'CLAIMING_CLIENTS') {
            console.log('Service worker is claiming clients');
          }
        };
        
        existingRegistration.active.postMessage({
          type: 'CLAIM_CLIENTS'
        }, [messageChannel.port2]);
      }
      
      return existingRegistration;
    }
    
    // Register new service worker with controlled timing
    console.log('Registering new service worker...');
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      // Update only when user is idle to minimize disruption
      updateViaCache: 'none',
    });
    
    serviceWorkerRegistration = registration;
    console.log('Service Worker registered with scope:', registration.scope);
    
    // Set up service worker update handling
    setupUpdateHandler(registration);
    
    // Wait for the service worker to be activated
    if (registration.installing) {
      console.log('Waiting for service worker to be activated...');
      await new Promise<void>((resolve) => {
        const worker = registration.installing;
        if (!worker) {
          resolve();
          return;
        }
        
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            console.log('Service worker activated');
            resolve();
          }
        });
        
        // Add timeout to prevent blocking indefinitely
        setTimeout(resolve, 5000);
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    
    // Try one more time after a delay
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const retryRegistration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          serviceWorkerRegistration = retryRegistration;
          resolve(retryRegistration);
        } catch (retryError) {
          console.error('Service worker retry failed:', retryError);
          resolve(null);
        }
      }, 2000);
    });
  }
}

// Helper function to handle service worker updates
function setupUpdateHandler(registration: ServiceWorkerRegistration) {
  // Set up service worker update handling
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available, show update notification if desired
          console.log('New version available! Refresh to update.');
          
          // Dispatch event for the app to show a refresh notification
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    }
  });
  
  // Check for updates periodically but don't block the main thread
  if (registration.active) {
    // Schedule update checks when user is likely to be idle
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // First check after 10 minutes
        setTimeout(() => schedulePeriodicUpdates(registration), 10 * 60 * 1000);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => schedulePeriodicUpdates(registration), 10 * 60 * 1000);
    }
  }
}

// Helper function to schedule periodic updates
function schedulePeriodicUpdates(registration: ServiceWorkerRegistration) {
  // Check for updates
  registration.update().catch(err => console.error('Error updating service worker:', err));
  
  // Schedule next update when user is likely to be idle
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Increase update interval to 4 hours (was 1 hour)
      setTimeout(() => schedulePeriodicUpdates(registration), 4 * 60 * 60 * 1000);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    // Increase update interval to 4 hours (was 1 hour)
    setTimeout(() => schedulePeriodicUpdates(registration), 4 * 60 * 60 * 1000);
  }
}

// Initialize PWA features with better performance
export async function initPWA() {
  // Initialize features in parallel
  const results = await Promise.allSettled([
    Promise.resolve().then(checkInstallability),
    Promise.resolve().then(registerServiceWorker),
    Promise.resolve().then(setupNativePullToRefresh),
    Promise.resolve().then(disableZoom),
    Promise.resolve().then(setupKeepAlive),
    Promise.resolve().then(setupOfflineDetection)
  ]);
  
  // Log any errors but don't block the app
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`PWA initialization step ${index} failed:`, result.reason);
    }
  });
  
  return true;
}

// Set up native pull-to-refresh functionality
export function setupNativePullToRefresh() {
  // Don't do anything special - the browser's native pull-to-refresh is now enabled
  // This function exists for clarity and future enhancement if needed
  console.log('Native pull-to-refresh is enabled');
}

// Disable zoom functionality on mobile devices
export function disableZoom() {
  // Prevent pinch zoom by handling touchmove events
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent double-tap zoom
  let lastTapTime = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
    }
    lastTapTime = currentTime;
  }, { passive: false });
  
  console.log('Zoom disabled on mobile devices');
}

// New function to keep the service worker alive
export function setupKeepAlive() {
  const keepAliveInterval = 10 * 60 * 1000; // 10 minutes
  
  // Set up a periodic ping to keep the service worker active
  setInterval(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Send a keep-alive message to the service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'KEEP_ALIVE',
        timestamp: Date.now()
      });
      
      console.log('Service worker keep-alive ping sent');
    }
  }, keepAliveInterval);
  
  // Also ping on visibility changes to immediately reactivate when user returns
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 
        'serviceWorker' in navigator && 
        navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'KEEP_ALIVE',
        timestamp: Date.now(),
        reason: 'visibilitychange'
      });
      console.log('Service worker keep-alive ping sent on visibility change');
    }
  });
}

// Setup offline detection and notification
export function setupOfflineDetection() {
  // Track last known state to avoid duplicate notifications
  let wasOffline = !navigator.onLine;
  let offlineTime = wasOffline ? Date.now() : 0;
  
  // Set initial offline status
  if (!navigator.onLine) {
    console.log('App starting in offline mode');
    document.body.classList.add('offline-mode');
    
    // Dispatch offline event for app to handle
    window.dispatchEvent(new CustomEvent('app-offline'));
  }
  
  // Setup online event listener
  window.addEventListener('online', () => {
    if (wasOffline) {
      console.log('App is back online');
      document.body.classList.remove('offline-mode');
      
      // Calculate how long we were offline
      const offlineDuration = Date.now() - offlineTime;
      console.log(`Device was offline for ${Math.round(offlineDuration/1000/60)} minutes`);
      
      // Dispatch an event for the app to handle
      window.dispatchEvent(new CustomEvent('app-online', {
        detail: { offlineDuration }
      }));
      
      // Only reload for very long offline periods (2+ hours)
      if (offlineDuration > 2 * 60 * 60 * 1000) {
        console.log('Long offline period detected, refreshing app');
        setTimeout(() => window.location.reload(), 1000);
        return;
      }
      
      // Attempt to sync any pending changes
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_NOW'
        });
      }
    }
    wasOffline = false;
    offlineTime = 0;
  });
  
  // Setup offline event listener
  window.addEventListener('offline', () => {
    console.log('App is now offline');
    document.body.classList.add('offline-mode');
    wasOffline = true;
    offlineTime = Date.now();
    
    // Dispatch offline event for app to handle
    window.dispatchEvent(new CustomEvent('app-offline'));
  });
  
  // Add CSS for offline indication
  const style = document.createElement('style');
  style.textContent = `
    .offline-mode::after {
      content: 'OFFLINE MODE';
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
  
  // Add offline recovery logic
  window.addEventListener('load', () => {
    // Check if the service worker might be in a bad state
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length === 0 && navigator.onLine) {
          // No service worker registered but we're online - try to register
          registerServiceWorker().catch(console.error);
        }
      });
    }
  });
  
  // Add periodic service worker health check
  const healthCheckInterval = 15 * 60 * 1000; // 15 minutes
  setInterval(() => {
    if (navigator.onLine && 'serviceWorker' in navigator) {
      // Check service worker health
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length === 0) {
          // No service worker registered - try to register
          registerServiceWorker().catch(console.error);
        } else {
          // Send health check ping to any active service worker
          const activeWorker = navigator.serviceWorker.controller;
          if (activeWorker) {
            activeWorker.postMessage({
              type: 'KEEP_ALIVE',
              timestamp: Date.now(),
              reason: 'healthCheck'
            });
          }
        }
      });
    }
  }, healthCheckInterval);
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}