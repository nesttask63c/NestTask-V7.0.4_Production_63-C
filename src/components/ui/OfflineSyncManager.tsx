import { useEffect, useState } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

interface OfflineSyncManagerProps {
  onSync: () => Promise<void>;
}

interface SyncStatus {
  task: boolean;
  routine: boolean;
  courseTeacher: boolean;
}

export function OfflineSyncManager({ onSync }: OfflineSyncManagerProps) {
  const isOffline = useOfflineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncComplete, setSyncComplete] = useState<SyncStatus>({
    task: false,
    routine: false,
    courseTeacher: false
  });

  // Track offline status changes and auto-sync on reconnection
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // We were offline but now we're online - automatically sync without prompt
      handleSync();
    }
  }, [isOffline, wasOffline]);

  // Listen for background sync completion messages from service worker
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC_COMPLETED') {
        const category = event.data.category;
        
        setSyncComplete(prev => ({
          ...prev,
          [category]: true
        }));
        
        // If all sync operations are complete, reset state
        if (
          (category === 'task' && syncComplete.routine && syncComplete.courseTeacher) ||
          (category === 'routine' && syncComplete.task && syncComplete.courseTeacher) ||
          (category === 'courseTeacher' && syncComplete.task && syncComplete.routine)
        ) {
          // Reset after all syncs complete
          setTimeout(() => {
            setWasOffline(false);
            setSyncComplete({
              task: false,
              routine: false,
              courseTeacher: false
            });
          }, 1000);
        }
      }
    };

    // Add message listener for service worker communication
    navigator.serviceWorker.addEventListener('message', handleSyncMessage);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSyncMessage);
    };
  }, [syncComplete]);

  // Handle sync action
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      await onSync();
      
      // If no background sync events are received within 5 seconds, consider sync complete
      const syncTimeout = setTimeout(() => {
        if (!syncComplete.task && !syncComplete.routine && !syncComplete.courseTeacher) {
          setWasOffline(false);
        }
      }, 5000);
      
      return () => clearTimeout(syncTimeout);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't render any UI
  return null;
} 