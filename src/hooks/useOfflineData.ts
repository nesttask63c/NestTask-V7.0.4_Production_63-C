import { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, STORES, withOfflineFallback } from '../utils/offlineStorage';

/**
 * Custom hook for managing offline data access and synchronization
 * @param storeKey The IndexedDB store key to use
 * @param onlineData The data from the online source
 * @param fetcher Function to fetch data when online
 */
export function useOfflineData<T>(
  storeKey: string,
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isOffline = useOfflineStatus();

  // Fetch data based on online/offline status
  const fetchData = useCallback(async (forceFresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Use our withOfflineFallback utility to handle offline gracefully
      const result = await withOfflineFallback(
        async () => {
          if (isOffline && !forceFresh) {
            throw new Error('Offline mode - using cached data');
          }
          return await fetcher();
        },
        storeKey
      );
      
      setData(result);
    } catch (err) {
      console.error(`Error fetching ${storeKey} data:`, err);
      setError(err as Error);
      
      // Even if withOfflineFallback fails, try one more time to get cached data
      try {
        const cachedData = await getAllFromIndexedDB(storeKey);
        if (cachedData && cachedData.length > 0) {
          console.log(`Last resort: Using cached ${storeKey} data after all failures`);
          setData(cachedData as unknown as T);
          // Don't clear the error, but at least show some data
        }
      } catch (cacheErr) {
        console.error(`Critical error: Failed to get any ${storeKey} data:`, cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, [storeKey, isOffline, fetcher]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save online data to IndexedDB whenever it changes
  useEffect(() => {
    const saveOnlineData = async () => {
      if (!isOffline && onlineData) {
        try {
          await saveToIndexedDB(storeKey, onlineData);
          console.log(`Saved ${storeKey} data to IndexedDB for offline use`);
        } catch (err) {
          console.error(`Error saving ${storeKey} data to IndexedDB:`, err);
        }
      }
    };

    saveOnlineData();
  }, [storeKey, onlineData, isOffline]);

  // Add refresh function to explicitly refresh data
  const refreshData = useCallback(async () => {
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, isOffline, refreshData };
}

/**
 * Hook for accessing tasks offline
 * @param onlineData The tasks from the online source
 * @param fetcher Function to fetch tasks when online
 */
export function useOfflineTasks<T>(
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  return useOfflineData(STORES.TASKS, onlineData, fetcher);
}

/**
 * Hook for accessing routines offline
 * @param onlineData The routines from the online source
 * @param fetcher Function to fetch routines when online
 */
export function useOfflineRoutines<T>(
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  return useOfflineData(STORES.ROUTINES, onlineData, fetcher);
}

/**
 * Hook for accessing user data offline
 * @param onlineData The user data from the online source
 * @param fetcher Function to fetch user data when online
 */
export function useOfflineUserData<T>(
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  return useOfflineData(STORES.USER_DATA, onlineData, fetcher);
}

/**
 * Hook for accessing courses offline
 * @param onlineData The courses from the online source
 * @param fetcher Function to fetch courses when online
 */
export function useOfflineCourses<T>(
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  return useOfflineData(STORES.COURSES, onlineData, fetcher);
}

/**
 * Hook for accessing teachers offline
 * @param onlineData The teachers from the online source
 * @param fetcher Function to fetch teachers when online
 */
export function useOfflineTeachers<T>(
  onlineData: T | null | undefined,
  fetcher: () => Promise<T>,
) {
  return useOfflineData(STORES.TEACHERS, onlineData, fetcher);
} 