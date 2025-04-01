import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
// Import CSS (Vite handles this correctly)
import './index.css';
import { LoadingScreen } from '@/components/LoadingScreen';
import { initPWA } from '@/utils/pwa';
import { prefetchResources, prefetchAsset, prefetchApiData } from '@/utils/prefetch';
// Use normal import without extension, the path alias will handle it correctly
import { STORES } from '@/utils/offlineStorage';

// Performance optimizations initialization
const startTime = performance.now();

// Mark the first paint timing
performance.mark('app-init-start');

// Lazy load the main App component
const App = lazy(() => import('./App').then(module => {
  // Track and log module loading time
  const loadTime = performance.now() - startTime;
  console.debug(`App component loaded in ${loadTime.toFixed(2)}ms`);
  return module;
}));

// Initialize PWA functionality in parallel but don't block initial render
const pwaPromise = Promise.resolve().then(() => {
  setTimeout(() => {
    initPWA().catch(err => console.error('PWA initialization error:', err));
  }, 1000);
});

// Enhanced prefetch for resources with priority marking
const prefetchCriticalResources = () => {
  if (navigator.onLine) {
    // Define critical resources with priority
    const criticalResources = [
      { 
        type: 'asset' as const, 
        key: 'manifest', 
        loader: '/manifest.json',
        options: { priority: 'high' as const }
      },
      { 
        type: 'asset' as const, 
        key: 'icon', 
        loader: '/icons/icon-192x192.png',
        options: { priority: 'high' as const }
      },
      { 
        type: 'route' as const, 
        key: 'auth', 
        loader: () => import('./pages/AuthPage'),
        options: { priority: 'high' as const }
      },
      // API data prefetching for the most important data
      { 
        type: 'api' as const, 
        key: 'tasks', 
        loader: {
          tableName: 'tasks',
          queryFn: (query: any) => query.select('*').limit(10),
          storeName: STORES.TASKS
        },
        options: { priority: 'high' as const }
      },
      { 
        type: 'api' as const, 
        key: 'routines', 
        loader: {
          tableName: 'routines',
          queryFn: (query: any) => query.select('*').eq('is_active', true).limit(1),
          storeName: STORES.ROUTINES
        },
        options: { priority: 'high' as const }
      },
      // Add prefetch for courses and teachers to support Routine page in offline mode
      { 
        type: 'api' as const, 
        key: 'courses', 
        loader: {
          tableName: 'courses',
          queryFn: (query: any) => query.select('*'),
          storeName: STORES.COURSES
        },
        options: { priority: 'medium' as const }
      },
      { 
        type: 'api' as const, 
        key: 'teachers', 
        loader: {
          tableName: 'teachers',
          queryFn: (query: any) => query.select('*'),
          storeName: STORES.TEACHERS
        },
        options: { priority: 'medium' as const }
      },
      { 
        type: 'asset' as const, 
        key: 'offline', 
        loader: '/offline.html',
        options: { priority: 'low' as const }
      }
    ];
    
    // Prefetch all critical resources in parallel with priority
    prefetchResources(criticalResources);
  }
};

// Optimize connection to the server
const establishConnectionOptimizations = () => {
  // Use connection preload hints
  const domains = [
    import.meta.env.VITE_SUPABASE_URL || '',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  domains.forEach(domain => {
    if (!domain) return;
    
    try {
      const url = new URL(domain);
      // DNS prefetch
      const dnsPrefetch = document.createElement('link');
      dnsPrefetch.rel = 'dns-prefetch';
      dnsPrefetch.href = url.origin;
      document.head.appendChild(dnsPrefetch);
      
      // Preconnect for faster initial connection
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = url.origin;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);
      
      console.debug(`Connection optimization applied for ${url.origin}`);
    } catch (err) {
      console.error('Error setting up connection optimization:', err);
    }
  });
  
  // Optimize bandwidth usage with priority fetch
  if ('fetch' in window) {
    const originalFetch = window.fetch;
    
    // Enhanced fetch with priority hints
    window.fetch = function (input, init) {
      // Automatically add a cache buster to avoid stale data
      if (typeof input === 'string' && !input.includes('?_cb=')) {
        const url = new URL(input, window.location.origin);
        url.searchParams.set('_cb', Date.now().toString());
        input = url.toString();
      }
      
      // Enhanced options with priority hints
      const enhancedInit = {
        ...init,
        // Add modern browser fetch priority hints when supported
        priority: init?.priority || 'auto',
      };
      
      return originalFetch.call(window, input, enhancedInit);
    };
  }
};

// Initialize optimizations in parallel - critical path first
Promise.resolve()
  .then(() => {
    // First tackle the connection optimizations
    establishConnectionOptimizations();
    
    // Then start prefetching critical resources
    prefetchCriticalResources();
    
    // Then handle PWA initialization
    return pwaPromise;
  })
  .catch(console.error)
  .finally(() => {
    // Performance measurement
    performance.measure('app-optimizations', 'app-init-start');
    performance.getEntriesByName('app-optimizations').forEach(entry => {
      console.debug(`Optimizations completed in ${entry.duration.toFixed(2)}ms`);
    });
  });

// Get the root element with null check
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id "root" in the HTML.');
}

// Create the root with improved error handling
const root = createRoot(rootElement);

// Track initial render time
performance.mark('react-mount-start');

// Render the app with minimal suspense delay and initialize loading state in DOM
root.render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen minimumLoadTime={1200} showProgress={true} />}>
      <App />
      <Analytics />
    </Suspense>
  </StrictMode>
);

// Add reliable cleanup for loading screen
window.addEventListener('load', () => {
  // Measure the actual load time
  const loadTime = performance.now() - startTime;
  console.debug(`App loaded in ${loadTime.toFixed(2)}ms`);
  
  // Delay loading screen removal to ensure the app is fully rendered
  // React Suspense might still be showing fallback even after window load
  setTimeout(() => {
    const loadingScreen = document.querySelector('.loading') as HTMLElement;
    if (loadingScreen) {
      // Inspect the root element to see if React has mounted
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.childNodes.length === 0) {
        // React hasn't mounted yet, don't remove the loading screen
        console.debug('React not mounted yet, keeping loading screen');
        return;
      }
      
      // Add a fade-out effect before removing
      loadingScreen.style.transition = 'opacity 0.3s ease-out';
      loadingScreen.style.opacity = '0';
      
      // Remove from DOM after transition completes
      setTimeout(() => {
        loadingScreen.remove();
      }, 300);
    }
  }, 300); // Wait to ensure React has fully hydrated the DOM
});

// Preload other routes after initial render to improve navigation speed
setTimeout(() => {
  // Preload common routes in the background after main interface is visible
  const routesToPreload = [
    import('./pages/UpcomingPage'),
    import('./pages/SearchPage')
  ];
  
  Promise.all(routesToPreload)
    .then(() => console.debug('Background routes preloaded'))
    .catch(err => console.warn('Error preloading routes:', err));
}, 2000);

// Measure and log render completion time
performance.measure('react-mount', 'react-mount-start');
performance.getEntriesByName('react-mount').forEach(entry => {
  console.debug(`Initial render completed in ${entry.duration.toFixed(2)}ms`);
});