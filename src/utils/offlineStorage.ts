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

/**
 * Creates a wrapper for API calls that automatically falls back to IndexedDB when offline
 * @param apiCall Function that performs the network request
 * @param storeName The store to check for cached data
 * @param filterFn Optional function to filter cached data (default returns all)
 */
export async function withOfflineFallback<T>(
  apiCall: () => Promise<T>,
  storeName: string,
  filterFn: (item: any) => boolean = () => true
): Promise<T> {
  try {
    // If online, try the API call first
    if (navigator.onLine) {
      try {
        const data = await apiCall();
        return data;
      } catch (error) {
        console.warn(`API call failed, falling back to cached data for ${storeName}:`, error);
        // Continue to fallback if API call fails
      }
    }
    
    // If offline or API call failed, get from IndexedDB
    console.log(`Loading offline data from ${storeName}`);
    const cachedData = await getAllFromIndexedDB(storeName);
    const filteredData = cachedData.filter(filterFn);
    
    // If we have cached data, return it
    if (filteredData.length > 0) {
      console.log(`Found ${filteredData.length} cached items in ${storeName}`);
      return filteredData as unknown as T;
    }
    
    // If no cached data, throw an error
    throw new Error(`No cached data available for ${storeName} while offline`);
  } catch (error) {
    console.error(`Error in offline fallback for ${storeName}:`, error);
    // Return empty array or default value as appropriate
    return ([] as unknown) as T;
  }
}

/**
 * Force load data from IndexedDB when offline
 * This is a critical function that ensures data is loaded even when the app initially loads offline
 */
export async function forceLoadOfflineData() {
  if (navigator.onLine) {
    // We're online, so no need to force load
    return;
  }
  
  console.log('Offline mode detected - forcing load of cached data');
  
  try {
    // Load all data from critical stores
    const stores = Object.values(STORES);
    const loadedData: Record<string, unknown[]> = {};
    
    // Open database once
    const db = await openDatabase();
    
    // Load data from each store
    for (const store of stores) {
      try {
        const tx = db.transaction(store, 'readonly');
        const storeObj = tx.objectStore(store);
        
        // Get all data from store
        const data = await new Promise<unknown[]>((resolve, reject) => {
          const request = storeObj.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        // Store data in result object
        loadedData[store] = data;
        console.log(`Loaded ${data.length} items from ${store} for offline use`);
      } catch (error) {
        console.warn(`Failed to load ${store} data:`, error);
      }
    }
    
    // Return all loaded data
    return loadedData;
  } catch (error) {
    console.error('Failed to force load offline data:', error);
  }
} 