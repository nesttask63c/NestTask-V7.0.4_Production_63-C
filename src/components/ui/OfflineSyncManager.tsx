import { useEffect, useState } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [syncComplete, setSyncComplete] = useState<SyncStatus>({
    task: false,
    routine: false,
    courseTeacher: false
  });
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  // Track offline status changes
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setSyncMessage('Network connection unavailable. Your changes will be synchronized automatically once the connection is restored.');
    } else if (wasOffline) {
      // We were offline but now we're online
      setShowSyncPrompt(true);
      setSyncMessage('Connection restored. Would you like to synchronize your changes now?');
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
        
        setSyncMessage(`${category.charAt(0).toUpperCase() + category.slice(1)} data synchronized successfully!`);
        setSyncSuccess(true);
        
        // If all sync operations are complete, update UI
        if (
          (category === 'task' && syncComplete.routine && syncComplete.courseTeacher) ||
          (category === 'routine' && syncComplete.task && syncComplete.courseTeacher) ||
          (category === 'courseTeacher' && syncComplete.task && syncComplete.routine)
        ) {
          // Reset after all syncs complete
          setTimeout(() => {
            setSyncSuccess(null);
            setShowSyncPrompt(false);
            setWasOffline(false);
            setSyncComplete({
              task: false,
              routine: false,
              courseTeacher: false
            });
          }, 3000);
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
    setSyncMessage('Syncing your offline changes...');
    
    try {
      await onSync();
      
      // If no background sync events are received within 5 seconds, consider sync complete
      const syncTimeout = setTimeout(() => {
        if (!syncComplete.task && !syncComplete.routine && !syncComplete.courseTeacher) {
          setSyncMessage('Sync complete!');
          setSyncSuccess(true);
          
          // Hide after a delay
          setTimeout(() => {
            setShowSyncPrompt(false);
            setWasOffline(false);
            setSyncSuccess(null);
          }, 3000);
        }
      }, 5000);
      
      return () => clearTimeout(syncTimeout);
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncMessage('Error syncing data. Please try again.');
      setSyncSuccess(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't render anything if we don't need to show the sync prompt
  if (!showSyncPrompt && !isOffline) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 
                    bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 
                    flex items-center gap-3 animate-slide-up
                    max-w-sm w-full mx-auto">
      <div className="flex-shrink-0">
        {isOffline ? (
          <WifiOff className="h-5 w-5 text-amber-500" />
        ) : syncSuccess === true ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : syncSuccess === false ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Wifi className="h-5 w-5 text-green-500" />
        )}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {syncMessage}
        </p>
        
        {isSyncing && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
        )}
      </div>
      
      {!isOffline && !syncSuccess && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 
                     text-white px-3 py-1 rounded-md text-sm font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync
            </>
          )}
        </button>
      )}
    </div>
  );
} 