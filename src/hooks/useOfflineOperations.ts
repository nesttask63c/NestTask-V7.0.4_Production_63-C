import { useState, useCallback, useEffect } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, deleteFromIndexedDB } from '../utils/offlineStorage';

// Define the types of operations that can be stored for offline use
export type OfflineOperationType = 'create' | 'update' | 'delete';

// Store names for pending operations
const PENDING_OPERATIONS = {
  TASKS: 'pendingTaskOperations',
  ROUTINES: 'pendingRoutineOperations',
  COURSES: 'pendingCourseOperations',
  TEACHERS: 'pendingTeacherOperations'
};

export interface PendingOperation {
  id: string;
  type: OfflineOperationType;
  endpoint: string;
  payload: any;
  timestamp: number;
  userId: string;
}

interface UseOfflineOperationsParams {
  entityType: 'task' | 'routine' | 'course' | 'teacher';
  userId: string;
}

interface UseOfflineOperationsResult {
  saveOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'userId'>) => Promise<void>;
  syncOperations: () => Promise<void>;
  pendingOperations: PendingOperation[];
  hasPendingOperations: boolean;
  isSyncing: boolean;
}

/**
 * Hook for managing operations that need to be performed while offline
 * and synchronized when back online.
 */
export function useOfflineOperations({ 
  entityType, 
  userId 
}: UseOfflineOperationsParams): UseOfflineOperationsResult {
  const isOffline = useOfflineStatus();
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Determine which store to use based on entityType
  const getStoreNameForEntityType = useCallback(() => {
    switch (entityType) {
      case 'task':
        return PENDING_OPERATIONS.TASKS;
      case 'routine':
        return PENDING_OPERATIONS.ROUTINES;
      case 'course':
        return PENDING_OPERATIONS.COURSES;
      case 'teacher':
        return PENDING_OPERATIONS.TEACHERS;
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  }, [entityType]);
  
  // Load pending operations from IndexedDB
  const loadPendingOperations = useCallback(async () => {
    try {
      const storeName = getStoreNameForEntityType();
      const operations = await getAllFromIndexedDB(storeName);
      
      // Filter to only include operations for this user
      const userOperations = operations.filter(op => op.userId === userId);
      
      // Sort by timestamp, oldest first
      userOperations.sort((a, b) => a.timestamp - b.timestamp);
      
      setPendingOperations(userOperations);
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, [getStoreNameForEntityType, userId]);
  
  // Initialize by loading pending operations
  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);
  
  // Save an operation to be processed when online
  const saveOperation = useCallback(async (
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'userId'>
  ) => {
    try {
      const operationId = `${entityType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = Date.now();
      const storeName = getStoreNameForEntityType();
      
      const fullOperation: PendingOperation = {
        ...operation,
        id: operationId,
        timestamp,
        userId
      };
      
      await saveToIndexedDB(storeName, fullOperation);
      
      // Update UI state
      setPendingOperations(prev => [...prev, fullOperation]);
      
      console.log(`Operation saved for offline sync: ${operation.type} ${entityType}`);
      
      // Register for sync when back online
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Check if background sync is supported
          if ('sync' in registration) {
            // Register for the appropriate sync type
            let syncTag;
            switch (entityType) {
              case 'task':
                syncTag = 'taskSync';
                break;
              case 'routine':
                syncTag = 'routineSync';
                break;
              case 'course':
              case 'teacher':
                syncTag = 'courseTeacherSync';
                break;
            }
            
            await registration.sync.register(syncTag);
            console.log(`Registered for background sync: ${syncTag}`);
          } else {
            console.log('Background sync not supported in this browser');
          }
        } catch (error) {
          console.error('Failed to register for background sync:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save operation for offline sync:', error);
    }
  }, [entityType, getStoreNameForEntityType, userId]);
  
  // Sync operations when we're back online
  const syncOperations = useCallback(async () => {
    if (isOffline || pendingOperations.length === 0 || isSyncing) {
      return;
    }
    
    setIsSyncing(true);
    const storeName = getStoreNameForEntityType();
    
    try {
      for (const operation of pendingOperations) {
        try {
          // Perform the actual API call
          const init: RequestInit = {
            method: operation.type === 'create' ? 'POST' : 
                   operation.type === 'update' ? 'PUT' : 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          };
          
          // Add body for create and update operations
          if (operation.type !== 'delete') {
            init.body = JSON.stringify(operation.payload);
          }
          
          // Execute the API call
          const response = await fetch(operation.endpoint, init);
          
          if (!response.ok) {
            throw new Error(`Failed to sync operation. Status: ${response.status}`);
          }
          
          // Remove the operation from IndexedDB after successful sync
          await deleteFromIndexedDB(storeName, operation.id);
          
          console.log(`Successfully synced ${operation.type} operation for ${entityType}`);
        } catch (error) {
          console.error(`Failed to sync operation:`, error, operation);
          
          // If this is a network error, break the loop as we're offline again
          if (error instanceof TypeError && error.message.includes('network')) {
            break;
          }
        }
      }
      
      // Refresh the pending operations
      await loadPendingOperations();
    } catch (error) {
      console.error('Error during sync operations:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, pendingOperations, isSyncing, getStoreNameForEntityType, loadPendingOperations, entityType]);
  
  // Automatically try to sync when we come back online
  useEffect(() => {
    if (!isOffline && pendingOperations.length > 0) {
      syncOperations();
    }
  }, [isOffline, pendingOperations.length, syncOperations]);
  
  return {
    saveOperation,
    syncOperations,
    pendingOperations,
    hasPendingOperations: pendingOperations.length > 0,
    isSyncing
  };
} 