import { useState, useEffect } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, STORES } from '../utils/offlineStorage';

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
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isOffline) {
          // When offline, get data from IndexedDB
          console.log(`Offline: Fetching ${storeKey} from local storage`);
          const offlineData = await getAllFromIndexedDB(storeKey);
          setData(offlineData as unknown as T);
        } else {
          // When online, get data from API
          console.log(`Online: Fetching ${storeKey} from API`);
          const freshData = await fetcher();
          setData(freshData);

          // Store the fetched data in IndexedDB for offline use
          await saveToIndexedDB(storeKey, freshData);
        }
      } catch (err) {
        console.error(`Error fetching ${storeKey} data:`, err);
        setError(err as Error);
        
        // If there's an error fetching data online, try to use cached data
        if (!isOffline) {
          try {
            const cachedData = await getAllFromIndexedDB(storeKey);
            if (cachedData && cachedData.length > 0) {
              console.log(`Using cached ${storeKey} data due to online fetch error`);
              setData(cachedData as unknown as T);
              setError(null);
            }
          } catch (cacheErr) {
            console.error(`Error fetching cached ${storeKey} data:`, cacheErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeKey, isOffline, fetcher]);

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

  return { data, loading, error, isOffline };
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