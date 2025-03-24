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
      setTimeout(() => schedulePeriodicUpdates(registration), 60 * 60 * 1000);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => schedulePeriodicUpdates(registration), 60 * 60 * 1000);
  }
}

// Initialize PWA features with better performance
export async function initPWA() {
  // Initialize features in parallel
  const results = await Promise.allSettled([
    Promise.resolve().then(checkInstallability),
    Promise.resolve().then(registerServiceWorker)
  ]);
  
  // Log any errors but don't block the app
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`PWA initialization step ${index} failed:`, result.reason);
    }
  });
  
  return true;
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