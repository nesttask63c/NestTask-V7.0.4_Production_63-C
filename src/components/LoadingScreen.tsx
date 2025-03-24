import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  minimumLoadTime?: number;
}

export function LoadingScreen({ minimumLoadTime = 300 }: LoadingScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, minimumLoadTime);

    return () => clearTimeout(timer);
  }, [minimumLoadTime]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="spinner mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          NestTask
        </h2>
      </div>
    </div>
  );
}

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