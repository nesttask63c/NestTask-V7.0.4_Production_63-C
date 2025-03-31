import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    if (!navigator.onLine) {
      setShowIndicator(true);
      // Hide offline indicator after 5 seconds
      setTimeout(() => setShowIndicator(false), 5000);
    }

    // Handle online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      // Show the indicator briefly when coming back online
      setShowIndicator(true);
      // Hide the indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
      // Hide the offline indicator after 5 seconds
      setTimeout(() => setShowIndicator(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
        animate-slide-up
        ${isOffline 
          ? 'bg-red-600 text-white' 
          : 'bg-green-600 text-white'
        }
      `}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Network Unavailable</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Connection Restored</span>
        </>
      )}
    </div>
  );
} 