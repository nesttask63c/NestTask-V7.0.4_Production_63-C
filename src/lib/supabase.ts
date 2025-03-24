import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" to set up your project.');
}

// Optimize session storage to use IndexedDB for better performance
const getCustomStorage = () => {
  return {
    async getItem(key: string) {
      try {
        // Try to get from IndexedDB first for more persistent storage
        if ('indexedDB' in window) {
          return new Promise<string | null>((resolve) => {
            const request = indexedDB.open('supabase-auth', 1);
            
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('keyval')) {
                db.createObjectStore('keyval');
              }
            };
            
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('keyval', 'readonly');
              const store = tx.objectStore('keyval');
              const getRequest = store.get(key);
              
              getRequest.onsuccess = () => {
                resolve(getRequest.result);
              };
              
              getRequest.onerror = () => {
                resolve(localStorage.getItem(key));
              };
              
              tx.oncomplete = () => {
                db.close();
              };
            };
            
            request.onerror = () => {
              resolve(localStorage.getItem(key));
            };
          });
        }
      } catch (error) {
        console.error('Error accessing IndexedDB:', error);
      }
      
      // Fall back to localStorage if IndexedDB is not available or fails
      return localStorage.getItem(key);
    },
    
    async setItem(key: string, value: string) {
      try {
        // Store in both IndexedDB for persistence and localStorage for quick access
        if ('indexedDB' in window) {
          return new Promise<void>((resolve) => {
            const request = indexedDB.open('supabase-auth', 1);
            
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('keyval')) {
                db.createObjectStore('keyval');
              }
            };
            
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('keyval', 'readwrite');
              const store = tx.objectStore('keyval');
              store.put(value, key);
              
              tx.oncomplete = () => {
                db.close();
                localStorage.setItem(key, value);
                resolve();
              };
            };
            
            request.onerror = () => {
              localStorage.setItem(key, value);
              resolve();
            };
          });
        }
      } catch (error) {
        console.error('Error writing to IndexedDB:', error);
      }
      
      // Fall back to localStorage if IndexedDB is not available or fails
      localStorage.setItem(key, value);
    },
    
    async removeItem(key: string) {
      try {
        // Remove from both IndexedDB and localStorage
        if ('indexedDB' in window) {
          return new Promise<void>((resolve) => {
            const request = indexedDB.open('supabase-auth', 1);
            
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('keyval', 'readwrite');
              const store = tx.objectStore('keyval');
              store.delete(key);
              
              tx.oncomplete = () => {
                db.close();
                localStorage.removeItem(key);
                resolve();
              };
            };
            
            request.onerror = () => {
              localStorage.removeItem(key);
              resolve();
            };
          });
        }
      } catch (error) {
        console.error('Error removing from IndexedDB:', error);
      }
      
      // Fall back to localStorage if IndexedDB is not available or fails
      localStorage.removeItem(key);
    }
  };
};

// Cache for connection state to avoid multiple retries
let connectionAttempts = 0;
let isInitialized = false;
let connectionPromise: Promise<boolean> | null = null;

// Create optimized Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: getCustomStorage(),
  },
  global: {
    headers: {
      'X-Client-Info': 'nesttask@1.0.0',
      'Cache-Control': 'no-cache'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Add retry configuration with exponential backoff
  fetch: (url, options = {}) => {
    // Add a unique cache buster for authenticated requests to avoid stale data
    const urlObj = new URL(url);
    if (options.headers && 
        (options.headers as Record<string, string>)['Authorization']) {
      urlObj.searchParams.set('_cb', Date.now().toString());
    }
    
    return fetchWithRetry(urlObj.toString(), options);
  }
});

// Fetch with retry implementation using exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 300) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // If response status indicates a server error, retry
    if (response.status >= 500 && response.status < 600 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    // Only retry on network errors, not on client errors
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// Function to test connection with debouncing and caching
export async function testConnection() {
  // Return cached result if already initialized
  if (isInitialized) return true;
  
  // Return existing promise if already attempting connection
  if (connectionPromise) return connectionPromise;
  
  // Create new connection promise
  connectionPromise = (async () => {
    try {
      // Limit connection attempts
      if (connectionAttempts >= 3) {
        console.warn('Max connection attempts reached, returning cached status');
        return isInitialized;
      }
      
      connectionAttempts++;
      console.log('Testing Supabase connection, attempt', connectionAttempts);
      
      const { error } = await supabase.from('tasks').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase connection error:', error.message);
        return false;
      }
      
      isInitialized = true;
      console.log('Successfully connected to Supabase');
      return true;
    } catch (error: any) {
      console.error('Failed to connect to Supabase:', error.message);
      return false;
    } finally {
      // Clear connection promise after completion
      setTimeout(() => {
        connectionPromise = null;
      }, 2000);
    }
  })();
  
  return connectionPromise;
}

// Initialize connection on load with a delay to prioritize UI rendering
setTimeout(() => {
  testConnection().catch(console.error);
}, 1000);

// Export additional utility for checking connection status
export function getConnectionStatus() {
  return { isInitialized, connectionAttempts };
}