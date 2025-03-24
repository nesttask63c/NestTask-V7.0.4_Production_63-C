import { useEffect, useState, memo, useRef } from 'react';

interface LoadingScreenProps {
  minimumLoadTime?: number;
  showProgress?: boolean;
}

// Using memo for better performance
export const LoadingScreen = memo(function LoadingScreen({ 
  minimumLoadTime = 300, 
  showProgress = false 
}: LoadingScreenProps) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Preload key app assets
  useEffect(() => {
    const preloadAssets = () => {
      // Preload logo and any other critical images
      const imagesToPreload = ['/icons/icon-192x192.png'];
      
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };
    
    preloadAssets();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start fade out animation before completely hiding
      setFadeOut(true);
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        setShow(false);
      }, 300);
    }, minimumLoadTime);

    // Simulate loading progress if needed (with requestAnimationFrame for better performance)
    if (showProgress) {
      let lastTimestamp = 0;
      let animationFrameId: number;
      
      const updateProgress = (timestamp: number) => {
        // Only update every ~250ms for better performance
        if (timestamp - lastTimestamp > 250 || lastTimestamp === 0) {
          lastTimestamp = timestamp;
          setProgress(prev => {
            // More realistic progress that starts fast and slows down
            const increment = 100 - prev > 40 ? 10 : (100 - prev > 20 ? 5 : 2);
            const next = prev + Math.min(increment, Math.random() * increment);
            return next > 100 ? 100 : next;
          });
        }
        
        if (progress < 100) {
          animationFrameId = requestAnimationFrame(updateProgress);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateProgress);
      
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(animationFrameId);
      };
    }

    return () => clearTimeout(timer);
  }, [minimumLoadTime, showProgress, progress]);

  if (!show) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center">
        {/* Modern pulse loader */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full bg-blue-600/15 dark:bg-blue-400/15 animate-pulse"></div>
          <div className="absolute inset-[7px] rounded-full bg-blue-600 dark:bg-blue-400"></div>
        </div>
        
        <div className="text-base font-medium text-gray-800/90 dark:text-gray-100/90 mt-3 tracking-wide">
          NestTask
        </div>
        
        {showProgress && (
          <div className="w-28 mx-auto mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-0.5 overflow-hidden">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-0.5 rounded-full"
                style={{ width: `${progress}%`, transition: 'width 200ms ease-out' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// CSS for the spinner is in index.html as inline critical CSS
// .spinner {
//   width: 40px;
//   height: 40px;
//   border: 3px solid #e0e7ff;
//   border-radius: 50%;
//   border-top-color: #3b82f6;
//   animation: spin 1s linear infinite;
// }
// @keyframes spin {
//   to { transform: rotate(360deg); }
// }