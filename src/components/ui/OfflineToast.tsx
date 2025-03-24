import { useEffect, useState } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export function OfflineToast() {
  const isOffline = useOfflineStatus();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [isOnlineTransition, setIsOnlineTransition] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setMessage('You are now offline. Some features may be limited.');
      setIsOnlineTransition(false);
      setShow(true);
    } else {
      // Only show online message if we were previously offline
      if (show) {
        setMessage('You are back online!');
        setIsOnlineTransition(true);
        setShow(true);
        
        // Hide the toast after 3 seconds when coming back online
        const timer = setTimeout(() => {
          setShow(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOffline]);

  if (!show) return null;

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50
        max-w-sm w-full bg-white dark:bg-gray-800 
        shadow-lg rounded-lg pointer-events-auto
        flex items-center justify-between
        px-4 py-3
        animate-slide-in
        ${isOnlineTransition ? 'border-l-4 border-green-500' : 'border-l-4 border-amber-500'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 ${isOnlineTransition ? 'text-green-500' : 'text-amber-500'}`}>
          {isOnlineTransition ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </p>
      </div>
      <button
        type="button"
        className="bg-white dark:bg-gray-800 rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setShow(false)}
      >
        <span className="sr-only">Close</span>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 