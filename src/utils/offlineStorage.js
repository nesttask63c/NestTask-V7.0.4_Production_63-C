/**
 * Utility functions for managing offline data storage with IndexedDB
 */

const DB_NAME = 'nesttask-db';
const DB_VERSION = 1;

// Open the database connection
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'id' });
      }
      
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
        const pendingStore = db.createObjectStore('pendingOperations', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        // Create an index for the 'type' field to easily query operations by type
        pendingStore.createIndex('type', 'type', { unique: false });
        // Create an index for the 'timestamp' field to order operations
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Store data in IndexedDB
 * @param {string} storeName - The object store name
 * @param {Object} data - The data to store
 * @returns {Promise<any>} - A promise that resolves when the data is stored
 */
export const storeData = async (storeName, data) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Store data error:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to store data:', error);
    throw error;
  }
};

/**
 * Store multiple items in IndexedDB
 * @param {string} storeName - The object store name
 * @param {Array<Object>} items - Array of items to store
 * @returns {Promise<void>} - A promise that resolves when all items are stored
 */
export const storeMultipleItems = async (storeName, items) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let count = 0;
      
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Store multiple items error:', event.target.error);
        reject(event.target.error);
      };
      
      // Add each item to the store
      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          count++;
          if (count === items.length) {
            // All items have been added
            console.log(`Successfully stored ${count} items in ${storeName}`);
          }
        };
      });
    });
  } catch (error) {
    console.error('Failed to store multiple items:', error);
    throw error;
  }
};

/**
 * Retrieve data from IndexedDB
 * @param {string} storeName - The object store name
 * @param {string|number} id - The ID of the record to retrieve
 * @returns {Promise<any>} - A promise that resolves with the retrieved data
 */
export const getData = async (storeName, id) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Get data error:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get data:', error);
    throw error;
  }
};

/**
 * Retrieve all data from a store
 * @param {string} storeName - The object store name
 * @returns {Promise<Array>} - A promise that resolves with all the data
 */
export const getAllData = async (storeName) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Get all data error:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get all data:', error);
    throw error;
  }
};

/**
 * Delete data from IndexedDB
 * @param {string} storeName - The object store name
 * @param {string|number} id - The ID of the record to delete
 * @returns {Promise<void>} - A promise that resolves when the data is deleted
 */
export const deleteData = async (storeName, id) => {
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
        console.error('Delete data error:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to delete data:', error);
    throw error;
  }
};

/**
 * Clear all data from a store
 * @param {string} storeName - The object store name
 * @returns {Promise<void>} - A promise that resolves when the store is cleared
 */
export const clearStore = async (storeName) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Clear store error:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to clear store:', error);
    throw error;
  }
};

/**
 * Add a pending operation to be synced when online
 * @param {string} type - The type of operation (create, update, delete)
 * @param {string} storeName - The object store affected
 * @param {Object} data - The data for the operation
 * @returns {Promise<number>} - A promise that resolves with the ID of the pending operation
 */
export const addPendingOperation = async (type, storeName, data) => {
  try {
    const pendingOperation = {
      type,
      storeName,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    return await storeData('pendingOperations', pendingOperation);
  } catch (error) {
    console.error('Failed to add pending operation:', error);
    throw error;
  }
};

/**
 * Get all pending operations
 * @returns {Promise<Array>} - A promise that resolves with all pending operations
 */
export const getPendingOperations = async () => {
  try {
    return await getAllData('pendingOperations');
  } catch (error) {
    console.error('Failed to get pending operations:', error);
    throw error;
  }
};

/**
 * Remove a pending operation
 * @param {number} id - The ID of the pending operation
 * @returns {Promise<void>} - A promise that resolves when the operation is removed
 */
export const removePendingOperation = async (id) => {
  try {
    return await deleteData('pendingOperations', id);
  } catch (error) {
    console.error('Failed to remove pending operation:', error);
    throw error;
  }
};

/**
 * Sync all pending operations with the server
 * @param {Function} apiCallback - A callback function to make the API call
 * @returns {Promise<Object>} - A promise that resolves with the sync results
 */
export const syncPendingOperations = async (apiCallback) => {
  try {
    const pendingOperations = await getPendingOperations();
    
    const results = {
      total: pendingOperations.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Sort operations by timestamp to ensure correct order
    pendingOperations.sort((a, b) => a.timestamp - b.timestamp);
    
    for (const operation of pendingOperations) {
      try {
        // Call the API callback to perform the server operation
        await apiCallback(operation.type, operation.storeName, operation.data);
        
        // Remove the operation after successful sync
        await removePendingOperation(operation.id);
        
        results.successful++;
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Update the pending operation with new retry count
        if (operation.retryCount < 5) {
          await storeData('pendingOperations', operation);
        } else {
          // If retry count reaches 5, remove the operation to prevent infinite retries
          await removePendingOperation(operation.id);
          
          results.errors.push({
            operationId: operation.id,
            type: operation.type,
            storeName: operation.storeName,
            error: error.message || 'Unknown error'
          });
        }
        
        results.failed++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Failed to sync pending operations:', error);
    throw error;
  }
};

/**
 * Update the last sync timestamp
 * @returns {Promise<void>} - A promise that resolves when the timestamp is updated
 */
export const updateLastSyncTimestamp = async () => {
  try {
    await storeData('metadata', {
      id: 'lastSync',
      timestamp: Date.now()
    });
    console.log('Last sync timestamp updated');
  } catch (error) {
    console.error('Failed to update last sync timestamp:', error);
    throw error;
  }
};

/**
 * Get the last sync timestamp
 * @returns {Promise<number|null>} - A promise that resolves with the timestamp or null
 */
export const getLastSyncTimestamp = async () => {
  try {
    const data = await getData('metadata', 'lastSync');
    return data ? data.timestamp : null;
  } catch (error) {
    console.error('Failed to get last sync timestamp:', error);
    return null;
  }
};

/**
 * Check if the app needs a fresh data sync based on elapsed time
 * @param {number} maxAgeMinutes - Maximum age in minutes before requiring a fresh sync
 * @returns {Promise<boolean>} - A promise that resolves with whether a sync is needed
 */
export const needsFreshSync = async (maxAgeMinutes = 60) => {
  try {
    const lastSync = await getLastSyncTimestamp();
    
    if (!lastSync) {
      return true; // No previous sync, definitely need a fresh sync
    }
    
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    
    return (now - lastSync) > maxAgeMs;
  } catch (error) {
    console.error('Failed to check if fresh sync is needed:', error);
    return true; // On error, assume sync is needed
  }
};

export default {
  storeData,
  storeMultipleItems,
  getData,
  getAllData,
  deleteData,
  clearStore,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  syncPendingOperations,
  updateLastSyncTimestamp,
  getLastSyncTimestamp,
  needsFreshSync
}; 