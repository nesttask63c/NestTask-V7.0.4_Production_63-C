import { useEffect, useState } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { Wifi, RefreshCw } from 'lucide-react';

interface OfflineSyncManagerProps {
  onSync: () => Promise<void>;
}

export function OfflineSyncManager({ onSync }: OfflineSyncManagerProps) {
  const isOffline = useOfflineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  // Track offline status changes
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // We were offline but now we're online
      setShowSyncPrompt(true);
    }
  }, [isOffline, wasOffline]);

  // Handle sync action
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await onSync();
      setShowSyncPrompt(false);
      setWasOffline(false);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!showSyncPrompt) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 
                    bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 
                    flex items-center gap-3 animate-slide-up">
      <div className="flex-shrink-0 text-green-500">
        <Wifi className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          You're back online! Sync your changes?
        </p>
      </div>
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
    </div>
  );
} 