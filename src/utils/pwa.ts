/**
 * Utility functions for handling PWA integration
 */

import { cleanupStaleCacheData } from '@/utils/offlineStorage';

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
      
      return existingRegistration;
    }
    
    // Register new service worker with controlled timing
    const swRegisterPromise = navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      // Update only when user is idle to minimize disruption
      updateViaCache: 'none',
    });
    
    // Apply timeout to service worker registration
    const registration = await Promise.race([
      swRegisterPromise,
      new Promise<null>((resolve) => {
        // If registration takes more than 5 seconds, proceed without waiting
        setTimeout(() => resolve(null), 5000);
      })
    ]) as ServiceWorkerRegistration | null;
    
    if (!registration) {
      console.warn('Service Worker registration timed out, app will continue without it');
      return null;
    }
    
    serviceWorkerRegistration = registration;
    console.log('Service Worker registered with scope:', registration.scope);
    
    // Set up service worker update handling
    setupUpdateHandler(registration);
    
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
  console.log('Initializing PWA features');
  
  // Check if we're recovering from a long offline period
  const offlineTimestamp = localStorage.getItem('sw_offline_timestamp');
  let wasOfflineLong = false;
  let offlineDuration = 0;
  
  if (offlineTimestamp && navigator.onLine) {
    offlineDuration = Date.now() - parseInt(offlineTimestamp);
    // If we were offline for more than an hour
    if (offlineDuration > 60 * 60 * 1000) {
      console.log(`Recovering from long offline period (${Math.round(offlineDuration/60000)} minutes)`);
      wasOfflineLong = true;
      
      // Clear the offline timestamp
      localStorage.removeItem('sw_offline_timestamp');
    }
  }
  
  // If we're recovering from a long offline period, take immediate action
  if (wasOfflineLong) {
    // First thing: force re-register the service worker
    if ('serviceWorker' in navigator) {
      try {
        // Check for existing registrations and remove them
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('Unregistering stale service worker');
          await registration.unregister();
        }
        
        // Register a fresh service worker
        console.log('Registering fresh service worker after extended offline period');
        const newRegistration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('New service worker registered successfully');
      } catch (error) {
        console.error('Error refreshing service worker:', error);
      }
    }
    
    // Then clean up stale data
    try {
      await cleanupStaleCacheData();
    } catch (error) {
      console.error('Error cleaning up stale cache data:', error);
    }
  }
  
  // Initialize features in parallel with error handling for each
  try {
    // Step 1: Check installability (this is fast and non-critical)
    await Promise.resolve().then(checkInstallability)
      .catch((err: Error) => console.error('Error checking installability:', err));
    
    // Step 2: Register service worker (critical for offline functionality)
    // Skip if we already registered a fresh one above
    if (!wasOfflineLong) {
      const registration = await registerServiceWorker()
        .catch((err: Error) => {
          console.error('Error registering service worker:', err);
          return null;
        });
      
      // If we failed to register the service worker and were offline for a long time,
      // this is a serious issue - reload the page to try again
      if (!registration && wasOfflineLong) {
        console.log('Failed to register service worker after long offline period, reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return false;
      }
    }
    
    // Step 3: Setup other PWA features in parallel
    await Promise.allSettled([
      Promise.resolve().then(setupNativePullToRefresh),
      Promise.resolve().then(disableZoom),
      Promise.resolve().then(setupKeepAlive),
      Promise.resolve().then(setupOfflineDetection)
    ]);
    
    // Step 4: For long offline periods, schedule an automatic refresh
    // This helps reset the app state completely after being offline
    if (wasOfflineLong && offlineDuration > 3 * 60 * 60 * 1000) { // More than 3 hours offline
      console.log('Scheduling automatic refresh after extended offline period');
      setTimeout(() => {
        window.location.reload();
      }, 15000); // Give the app 15 seconds to initialize before refreshing
    } else if (wasOfflineLong) {
      // Only schedule cleanup for shorter offline periods
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          cleanupStaleCacheData().catch((err: Error) => 
            console.error('Error in scheduled cache cleanup:', err)
          );
        });
      } else {
        setTimeout(() => {
          cleanupStaleCacheData().catch((err: Error) => 
            console.error('Error in scheduled cache cleanup:', err)
          );
        }, 10000); // Wait 10 seconds before cleaning up
      }
    } else {
      // Schedule a regular cleanup once a day
      // Check when the last cleanup was
      const lastCleanup = localStorage.getItem('sw_last_cache_cleanup');
      const now = Date.now();
      
      if (!lastCleanup || (now - parseInt(lastCleanup)) > 24 * 60 * 60 * 1000) {
        // If it's been more than a day, schedule a cleanup
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            cleanupStaleCacheData().catch((err: Error) => 
              console.error('Error in daily cache cleanup:', err)
            );
          });
        } else {
          setTimeout(() => {
            cleanupStaleCacheData().catch((err: Error) => 
              console.error('Error in daily cache cleanup:', err)
            );
          }, 30000); // Wait 30 seconds before cleaning up
        }
      }
    }
    
    console.log('PWA initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error during PWA initialization:', error);
    
    // Even if there's an error, at least try to set up offline detection
    try {
      setupOfflineDetection();
    } catch (e) {
      console.error('Failed to set up offline detection:', e);
    }
    
    return false;
  }
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
  const keepAliveInterval = 3 * 60 * 1000; // Reduced to 3 minutes from 5 minutes
  let lastPingTime = Date.now();
  let pingCount = 0;
  let recoveryMode = false;
  
  // Set up a periodic ping to keep the service worker active
  const intervalId = setInterval(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Send a keep-alive message to the service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'KEEP_ALIVE',
        timestamp: Date.now(),
        pingCount: ++pingCount
      });
      
      lastPingTime = Date.now();
      console.log(`Service worker keep-alive ping #${pingCount} sent`);
    } else if ('serviceWorker' in navigator) {
      // Service worker exists but not controlling the page
      console.warn('Service worker registered but not controlling the page, attempting recovery');
      recoveryMode = true;
      
      // Re-register the service worker
      navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      }).then(registration => {
        console.log('Service worker re-registered in recovery mode');
        
        // Force activation if possible
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }).catch(err => {
        console.error('Failed to re-register service worker in recovery:', err);
      });
    }
  }, keepAliveInterval);
  
  // Backup ping mechanism using localStorage to ensure service worker stays active
  // even during extended offline periods
  const storageCheckInterval = 30 * 1000; // Check every 30 seconds (reduced from 60 seconds)
  const storageCheckId = setInterval(() => {
    try {
      // Store the current time
      localStorage.setItem('sw_last_ping', Date.now().toString());
      
      // Check if we missed regular pings (offline for a while)
      const timeSinceLastPing = Date.now() - lastPingTime;
      if (timeSinceLastPing > keepAliveInterval * 1.5) {
        console.log('Missed regular service worker pings, attempting recovery ping');
        
        // Try to ping the service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'KEEP_ALIVE',
            timestamp: Date.now(),
            reason: 'recovery',
            pingCount: ++pingCount
          });
          lastPingTime = Date.now();
        } else if (!recoveryMode && 'serviceWorker' in navigator) {
          // If we don't have an active controller and we're not already in recovery mode
          recoveryMode = true;
          
          // Check for existing registrations
          navigator.serviceWorker.getRegistrations().then(registrations => {
            if (registrations.length === 0) {
              // No registrations found, try to register a new one
              console.log('No service worker registrations found, registering new one');
              
              navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
              }).then(registration => {
                console.log('Service worker registered after missing pings');
              }).catch(err => {
                console.error('Failed to register service worker after missing pings:', err);
              });
            } else {
              // Found registration(s), try to activate
              console.log('Found existing service worker registration, attempting to activate');
              
              registrations.forEach(registration => {
                if (registration.active) {
                  console.log('Registration has active worker, claiming clients');
                  
                  // Send message to claim clients
                  registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
                } else if (registration.waiting) {
                  console.log('Registration has waiting worker, skipping wait');
                  
                  // Skip waiting if there's a waiting worker
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else if (registration.installing) {
                  console.log('Registration has installing worker, waiting for install');
                }
              });
            }
          }).catch(err => {
            console.error('Error checking service worker registrations:', err);
          });
        }
      }
      
      // Check if we've been offline too long by comparing timestamps
      const storedTimestamp = localStorage.getItem('sw_offline_timestamp');
      if (storedTimestamp) {
        const offlineDuration = Date.now() - parseInt(storedTimestamp);
        
        // If offline for more than 30 minutes, attempt more aggressive recovery
        if (offlineDuration > 30 * 60 * 1000 && navigator.onLine) {
          console.log('Extended offline period detected, attempting aggressive recovery');
          
          // Clear offline timestamp since we're handling it
          localStorage.removeItem('sw_offline_timestamp');
          
          // Reload the page to restart everything fresh
          // But only if the user is active or this is not the first recovery attempt
          const recoveryAttempts = parseInt(localStorage.getItem('sw_recovery_attempts') || '0');
          localStorage.setItem('sw_recovery_attempts', (recoveryAttempts + 1).toString());
          
          if (recoveryAttempts > 0 && document.visibilityState === 'visible') {
            // Reload the page to get a fresh start with service workers
            window.location.reload();
          }
        }
      }
    } catch (err) {
      console.error('Error in service worker storage ping:', err);
    }
  }, storageCheckInterval);
  
  // Also ping on visibility changes to immediately reactivate when user returns
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 
        'serviceWorker' in navigator && 
        navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'KEEP_ALIVE',
        timestamp: Date.now(),
        reason: 'visibilitychange',
        pingCount: ++pingCount
      });
      lastPingTime = Date.now();
      console.log('Service worker keep-alive ping sent on visibility change');
      
      // Check if we need recovery after returning from background
      const lastActiveTimestamp = localStorage.getItem('sw_last_active');
      if (lastActiveTimestamp) {
        const inactiveTime = Date.now() - parseInt(lastActiveTimestamp);
        
        // If app was in background for more than 30 minutes, do a health check
        if (inactiveTime > 30 * 60 * 1000) {
          console.log('App was inactive for extended period, checking service worker health');
          
          // Send a health check ping
          navigator.serviceWorker.controller.postMessage({
            type: 'HEALTH_CHECK',
            timestamp: Date.now()
          });
          
          // Set a timeout to reload if we don't get a response
          const healthCheckTimeout = setTimeout(() => {
            console.log('No health check response received, reloading page');
            window.location.reload();
          }, 3000);
          
          // Listen for the response
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'HEALTH_CHECK_RESPONSE') {
              clearTimeout(healthCheckTimeout);
              console.log('Health check response received, service worker is healthy');
            }
          }, { once: true });
        }
      }
    }
    
    // Always update the last active timestamp
    if (document.visibilityState === 'visible') {
      localStorage.setItem('sw_last_active', Date.now().toString());
    }
  });
  
  // Track offline status to help with recovery
  window.addEventListener('offline', () => {
    // Store when we went offline
    localStorage.setItem('sw_offline_timestamp', Date.now().toString());
  });
  
  window.addEventListener('online', () => {
    const offlineTimestamp = localStorage.getItem('sw_offline_timestamp');
    if (offlineTimestamp) {
      const offlineDuration = Date.now() - parseInt(offlineTimestamp);
      
      // If we were offline for more than 10 minutes, do a health check
      if (offlineDuration > 10 * 60 * 1000) {
        console.log(`Back online after extended offline period (${Math.round(offlineDuration/60000)} minutes)`);
        
        // Do an immediate health check
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'HEALTH_CHECK',
            timestamp: Date.now(),
            offlineDuration
          });
        } else {
          // If no controller, reload the page to restore everything
          window.location.reload();
        }
      }
      
      // Clear the offline timestamp
      localStorage.removeItem('sw_offline_timestamp');
    }
  });
  
  // Listen for service worker responses to monitor health
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'KEEP_ALIVE_RESPONSE') {
      // Reset recovery mode if we're getting responses
      if (recoveryMode) {
        console.log('Service worker recovered, resetting recovery mode');
        recoveryMode = false;
        localStorage.setItem('sw_recovery_attempts', '0');
      }
    } else if (event.data && event.data.type === 'HEALTH_CHECK_RESPONSE') {
      console.log('Health check passed, service worker is responding');
    }
  });
  
  // Cleanup function
  return () => {
    clearInterval(intervalId);
    clearInterval(storageCheckId);
  };
}

// Setup offline detection and notification
export function setupOfflineDetection() {
  // Track last known state to avoid duplicate notifications
  let wasOffline = !navigator.onLine;
  
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
      
      // Dispatch an event for the app to handle
      window.dispatchEvent(new CustomEvent('app-online'));
      
      // Attempt to sync any pending changes
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_NOW'
        });
      }
    }
    wasOffline = false;
  });
  
  // Setup offline event listener
  window.addEventListener('offline', () => {
    console.log('App is now offline');
    document.body.classList.add('offline-mode');
    wasOffline = true;
    
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