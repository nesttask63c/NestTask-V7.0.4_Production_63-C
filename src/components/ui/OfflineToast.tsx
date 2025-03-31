import { useEffect } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export function OfflineToast() {
  const isOffline = useOfflineStatus();

  // Track offline status but don't show any UI
  useEffect(() => {
    // Just track offline status without showing notifications
  }, [isOffline]);

  // Don't render any UI
  return null;
} 