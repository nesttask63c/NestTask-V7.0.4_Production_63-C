import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show either the banner or button based on user's previous choice
      const hasClosedBanner = localStorage.getItem('pwa-banner-closed');
      if (!hasClosedBanner) {
        setShowBanner(true);
      } else {
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setShowBanner(false);
    }
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    setShowInstallButton(true);
    localStorage.setItem('pwa-banner-closed', 'true');
  };

  if (!showBanner && !showInstallButton) return null;

  if (showBanner) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-lg p-4 animate-slide-up">
        <button 
          onClick={handleCloseBanner}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-grow">
            <h3 className="font-medium text-gray-900 mb-1">Install NestTask</h3>
            <p className="text-sm text-gray-600 mb-3">
              Install NestTask for quick access and a better experience
            </p>
            
            <button
              onClick={handleInstall}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors animate-slide-up"
    >
      <Download className="w-5 h-5" />
      <span>Install App</span>
    </button>
  );
}