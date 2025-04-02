/**
 * Utility functions for handling offline data storage using IndexedDB
 */

// IndexedDB database name and version
export const DB_NAME = 'nesttask_offline_db';
export const DB_VERSION = 4; // Update version to 4

// Store names for different types of data
export const STORES = {
  TASKS: 'tasks',
  ROUTINES: 'routines',
  USER_DATA: 'userData',
  COURSES: 'courses',
  MATERIALS: 'materials',
  TEACHERS: 'teachers',
  // Add pending operations stores
  PENDING_TASK_OPS: 'pendingTaskOperations',
  PENDING_ROUTINE_OPS: 'pendingRoutineOperations',
  PENDING_COURSE_OPS: 'pendingCourseOperations',
  PENDING_TEACHER_OPS: 'pendingTeacherOperations'
};

/**
 * Initialize the IndexedDB database
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event: Event) => {
      console.error('Error opening IndexedDB', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        // Initial schema setup
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          console.log('Created tasks store');
        }
        if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
          db.createObjectStore(STORES.ROUTINES, { keyPath: 'id' });
          console.log('Created routines store');
        }
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
          console.log('Created userData store');
        }
      }
      
      if (oldVersion < 2) {
        // Version 2 schema updates
        if (!db.objectStoreNames.contains(STORES.COURSES)) {
          db.createObjectStore(STORES.COURSES, { keyPath: 'id' });
          console.log('Created courses store');
        }
        if (!db.objectStoreNames.contains(STORES.MATERIALS)) {
          db.createObjectStore(STORES.MATERIALS, { keyPath: 'id' });
          console.log('Created materials store');
        }
      }
      
      if (oldVersion < 3) {
        // Version 3 schema updates
        if (!db.objectStoreNames.contains(STORES.TEACHERS)) {
          db.createObjectStore(STORES.TEACHERS, { keyPath: 'id' });
          console.log('Created teachers store');
        }
      }
      
      if (oldVersion < 4) {
        // Version 4 schema updates - add stores for pending operations
        if (!db.objectStoreNames.contains(STORES.PENDING_TASK_OPS)) {
          db.createObjectStore(STORES.PENDING_TASK_OPS, { keyPath: 'id' });
          console.log('Created pending task operations store');
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_ROUTINE_OPS)) {
          db.createObjectStore(STORES.PENDING_ROUTINE_OPS, { keyPath: 'id' });
          console.log('Created pending routine operations store');
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_COURSE_OPS)) {
          db.createObjectStore(STORES.PENDING_COURSE_OPS, { keyPath: 'id' });
          console.log('Created pending course operations store');
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_TEACHER_OPS)) {
          db.createObjectStore(STORES.PENDING_TEACHER_OPS, { keyPath: 'id' });
          console.log('Created pending teacher operations store');
        }
      }
    };
  });
};

/**
 * Save data to IndexedDB
 * @param storeName The name of the store to save data to
 * @param data The data to save
 */
export async function saveToIndexedDB(storeName: string, data: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // If data is an array, add each item individually
      if (Array.isArray(data)) {
        data.forEach(item => {
          store.put(item);
        });
      } else {
        // Otherwise, add the single item
        store.put(data);
      }
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error(`Error saving to ${storeName}:`, (event.target as IDBTransaction).error);
        reject((event.target as IDBTransaction).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB save error:', error);
    throw error;
  }
}

/**
 * Get all data from a store in IndexedDB
 * @param storeName The name of the store to get data from
 */
export async function getAllFromIndexedDB(storeName: string): Promise<any[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting data from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB get error:', error);
    return [];
  }
}

/**
 * Get a specific item by ID from IndexedDB
 * @param storeName The name of the store to get data from
 * @param id The ID of the item to get
 */
export async function getByIdFromIndexedDB(storeName: string, id: string): Promise<any> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB get by ID error:', error);
    return null;
  }
}

/**
 * Delete data from IndexedDB
 * @param storeName The name of the store to delete data from
 * @param id The ID of the item to delete
 */
export async function deleteFromIndexedDB(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB delete error:', error);
    throw error;
  }
}

/**
 * Clear all data from a store in IndexedDB
 * @param storeName The name of the store to clear
 */
export async function clearIndexedDBStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log(`Successfully cleared ${storeName} store`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error clearing ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB clear error:', error);
    throw error;
  }
}

/**
 * Cleanup stale offline cache data to prevent corruption issues
 * This removes data that might be causing the app to fail when offline for long periods
 */
export async function cleanupStaleCacheData(): Promise<void> {
  try {
    console.log('Starting cleanup of stale cache data');
    
    // Check if cache cleanup has been performed recently
    const lastCleanup = localStorage.getItem('sw_last_cache_cleanup');
    const now = Date.now();
    
    if (lastCleanup) {
      const lastCleanupTime = parseInt(lastCleanup);
      // Only perform cleanup once per day
      if (now - lastCleanupTime < 24 * 60 * 60 * 1000) {
        console.log('Skipping cache cleanup, already performed in the last 24 hours');
        return;
      }
    }
    
    // 1. Clear any items in IndexedDB older than 7 days
    const db = await openDatabase();
    const stores = [...Object.values(STORES)];
    const cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
    
    // Critical paths to preserve even if they're old
    const criticalPaths = [
      '/index.html',
      '/offline.html',
      '/manifest.json',
      '/service-worker.js',
      '/',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ];
    
    // Process each store to remove stale data
    await Promise.all(stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.openCursor();
          let staleCount = 0;
          
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const item = cursor.value;
              
              // Skip auth tokens - they're handled separately with their own expiration logic
              if (storeName === 'auth' || 
                 (item && item.key && item.key.includes('supabase.auth.token'))) {
                cursor.continue();
                return;
              }
              
              // Check if the item has a timestamp and is older than cutoff
              if (item.updated_at && new Date(item.updated_at).getTime() < cutoffTime) {
                cursor.delete();
                staleCount++;
              } else if (item.createdAt && new Date(item.createdAt).getTime() < cutoffTime) {
                cursor.delete();
                staleCount++;
              } else if (item.timestamp && item.timestamp < cutoffTime) {
                cursor.delete();
                staleCount++;
              }
              
              cursor.continue();
            } else {
              if (staleCount > 0) {
                console.log(`Removed ${staleCount} stale items from ${storeName}`);
              }
            }
          };
          
          transaction.oncomplete = () => {
            resolve();
          };
          
          transaction.onerror = (event) => {
            console.error(`Error cleaning up stale data in ${storeName}:`, (event.target as IDBTransaction).error);
            resolve(); // Don't reject to allow other stores to be processed
          };
        } catch (error) {
          console.error(`Error in store cleanup for ${storeName}:`, error);
          resolve(); // Don't reject to allow other stores to be processed
        }
      });
    }));
    
    // 2. Clear expired cache entries
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      await Promise.all(cacheNames.map(async (cacheName) => {
        try {
          // Skip the metadata cache
          if (cacheName === 'sw-metadata') {
            return;
          }
          
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          let expiredCount = 0;
          
          // For each cached request, check if it's stale
          await Promise.all(requests.map(async (request) => {
            try {
              // Never delete critical paths
              if (criticalPaths.includes(new URL(request.url).pathname)) {
                console.log(`Preserving critical path: ${request.url}`);
                return;
              }
              
              const response = await cache.match(request);
              if (!response) return;
              
              // Check if we can extract date information
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const responseDate = new Date(dateHeader).getTime();
                
                // If older than 7 days, remove it
                if (now - responseDate > 7 * 24 * 60 * 60 * 1000) {
                  await cache.delete(request);
                  expiredCount++;
                }
              }
            } catch (error) {
              console.error(`Error processing cached request ${request.url}:`, error);
            }
          }));
          
          if (expiredCount > 0) {
            console.log(`Removed ${expiredCount} expired entries from cache ${cacheName}`);
          }
        } catch (error) {
          console.error(`Error cleaning up cache ${cacheName}:`, error);
        }
      }));
    }
    
    // 3. Record that we performed the cleanup
    localStorage.setItem('sw_last_cache_cleanup', now.toString());
    console.log('Completed stale cache data cleanup');
    
    return;
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

/**
 * Clear all data for a specific user from a store in IndexedDB
 * @param storeName The name of the store to clear
 * @param userId The ID of the user whose data should be cleared
 */
export async function clearUserDataFromStore(storeName: string, userId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          // If this item belongs to the user, delete it
          if (cursor.value.userId === userId) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          // Done processing all items
          console.log(`Successfully cleared user ${userId} data from ${storeName} store`);
          resolve();
        }
      };
      
      request.onerror = (event) => {
        console.error(`Error clearing user data from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('IndexedDB clear user data error:', error);
    throw error;
  }
}

/**
 * Refresh all IndexedDB data for a user
 * @param userId The ID of the user whose data should be refreshed
 */
export async function refreshUserCache(userId: string): Promise<void> {
  try {
    // Clear localStorage cache timestamps
    Object.keys(localStorage).forEach(key => {
      if (key.includes('_last_fetched') && key.includes(userId)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear IndexedDB user data
    await clearUserDataFromStore(STORES.TASKS, userId);
    
    console.log(`Successfully refreshed cache for user ${userId}`);
  } catch (error) {
    console.error('Error refreshing user cache:', error);
    throw error;
  }
}

/**
 * Remove all pending operations for an entity after successful sync
 * @param storePrefix The prefix for the store (e.g. 'pendingTaskOperations')
 */
export async function clearPendingOperations(storePrefix: string): Promise<void> {
  try {
    const db = await openDatabase();
    
    const storesToClear = Object.values(STORES)
      .filter(storeName => storeName.startsWith(storePrefix));
    
    const promises = storesToClear.map(storeName => 
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log(`Successfully cleared ${storeName} store`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error(`Error clearing ${storeName}:`, (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      })
    );
    
    await Promise.all(promises);
    console.log(`Successfully cleared all pending operations for ${storePrefix}`);
  } catch (error) {
    console.error('Error clearing pending operations:', error);
    throw error;
  }
} 