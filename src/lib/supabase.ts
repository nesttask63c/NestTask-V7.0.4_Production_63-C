import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" to set up your project.');
}

// Optimize session storage to use IndexedDB for better performance
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // Try to get from IndexedDB first for more persistent storage
    if ('indexedDB' in window) {
      try {
        // Increase version to ensure schema is current
        const request = indexedDB.open('supabase-auth', 2);
        
        // Make sure store exists
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('auth')) {
            db.createObjectStore('auth', { keyPath: 'key' });
          }
        };
        
        return new Promise<string | null>((resolve, reject) => {
          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction('auth', 'readonly');
            const store = transaction.objectStore('auth');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                // Check if the session is expired based on exp claim in JWT
                if (key === 'supabase.auth.token') {
                  try {
                    const session = JSON.parse(getRequest.result.value);
                    
                    if (session && session.access_token) {
                      // Parse the JWT to get expiration
                      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
                      const exp = payload.exp * 1000; // convert to ms
                      
                      // More aggressive token extension - if offline or token expires in less than 7 days,
                      // extend it by 30 days to ensure offline functionality
                      if ((exp - Date.now() < 7 * 24 * 60 * 60 * 1000) || !navigator.onLine) {
                        console.log('Extending session token expiration for offline use or approaching expiration');
                        
                        // Set a new expiration 30 days from now
                        const newExp = Date.now() + (30 * 24 * 60 * 60 * 1000);
                        payload.exp = Math.floor(newExp / 1000);
                        
                        // We can't modify the JWT itself, but we can update the expires_at
                        // in the session object to prevent auto-logout
                        session.expires_at = Math.floor(newExp / 1000);
                        
                        // Also update timestamps to help with cache validation
                        session._extended_at = Date.now();
                        session._offline_extension = true;
                        
                        // Store the modified session
                        customStorage.setItem(key, JSON.stringify(session));
                      }
                    }
                  } catch (parseError) {
                    console.error('Error parsing auth token:', parseError);
                  }
                }
                
                resolve(getRequest.result.value);
              } else {
                // If not in IndexedDB, check localStorage
                resolve(localStorage.getItem(key));
              }
            };
            
            getRequest.onerror = (error: any) => {
              console.error('Error getting auth from IndexedDB:', error);
              // Fall back to localStorage
              resolve(localStorage.getItem(key));
            };
          };
          
          request.onerror = (error: any) => {
            console.error('Error accessing IndexedDB:', error);
            // Fall back to localStorage if IndexedDB is not available or fails
            resolve(localStorage.getItem(key));
          };
        });
      } catch (error) {
        console.error('Error accessing IndexedDB:', error);
        // Fall back to localStorage if IndexedDB is not available or fails
        return localStorage.getItem(key);
      }
    }
    
    // Fall back to localStorage if IndexedDB is not available
    return localStorage.getItem(key);
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // Store in both IndexedDB for persistence and localStorage for quick access
    if ('indexedDB' in window) {
      try {
        // Increase version to ensure schema is current
        const request = indexedDB.open('supabase-auth', 2);
        
        // Make sure store exists
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('auth')) {
            db.createObjectStore('auth', { keyPath: 'key' });
          }
        };
        
        return new Promise<void>((resolve, reject) => {
          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction('auth', 'readwrite');
            const store = transaction.objectStore('auth');
            
            // Store with current timestamp for debugging
            const storeRequest = store.put({ 
              key, 
              value,
              timestamp: Date.now()
            });
            
            storeRequest.onsuccess = () => {
              // Also store in localStorage as backup
              localStorage.setItem(key, value);
              resolve();
            };
            
            storeRequest.onerror = (error: any) => {
              console.error('Error writing to IndexedDB:', error);
              localStorage.setItem(key, value);
              resolve();
            };
          };
          
          request.onerror = (error: any) => {
            console.error('Error writing to IndexedDB:', error);
            localStorage.setItem(key, value);
            resolve();
          };
        });
      } catch (error) {
        console.error('Error writing to IndexedDB:', error);
        // Fall back to localStorage if IndexedDB is not available or fails
        localStorage.setItem(key, value);
      }
    }
    
    // Fall back to localStorage if IndexedDB is not available
    localStorage.setItem(key, value);
  },
  
  removeItem: async (key: string): Promise<void> => {
    // Remove from both IndexedDB and localStorage
    if ('indexedDB' in window) {
      try {
        // Increase version to ensure schema is current
        const request = indexedDB.open('supabase-auth', 2);
        
        return new Promise<void>((resolve, reject) => {
          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction('auth', 'readwrite');
            const store = transaction.objectStore('auth');
            const deleteRequest = store.delete(key);
            
            deleteRequest.onsuccess = () => {
              // Also remove from localStorage
              localStorage.removeItem(key);
              resolve();
            };
            
            deleteRequest.onerror = (error: any) => {
              console.error('Error removing from IndexedDB:', error);
              localStorage.removeItem(key);
              resolve();
            };
          };
          
          request.onerror = (error: any) => {
            console.error('Error removing from IndexedDB:', error);
            localStorage.removeItem(key);
            resolve();
          };
        });
      } catch (error) {
        console.error('Error removing from IndexedDB:', error);
        // Fall back to localStorage if IndexedDB is not available or fails
        localStorage.removeItem(key);
      }
    }
    
    // Fall back to localStorage if IndexedDB is not available
    localStorage.removeItem(key);
  }
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
    storage: customStorage,
    storageKey: 'nesttask_supabase_auth',
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