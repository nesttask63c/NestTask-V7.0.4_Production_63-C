import { useState, useEffect } from 'react';
import { X, Bell, Moon, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationSettings } from './NotificationSettings';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('dark-mode') || 'false');
  });

  useEffect(() => {
    // Apply dark mode class when component mounts or darkMode changes
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('dark-mode', JSON.stringify(newValue));
    document.documentElement.classList.toggle('dark', newValue);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 dark-transition"
        onClick={onClose}
      />
      <div className="fixed z-50 w-full max-w-md transform transition-all duration-300 ease-in-out
                    top-[10%] left-1/2 -translate-x-1/2 px-4 sm:px-0">
        <div className="bg-white dark:bg-dark-700 rounded-2xl shadow-xl overflow-hidden dark-transition">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-6">
            {/* Notifications */}
            <NotificationSettings />

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/10 dark:bg-blue-100/10 rounded-lg">
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={handleDarkModeToggle}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                              peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute 
                              after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                              after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                              peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {/* Account Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/10 dark:bg-blue-100/10 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Account Type</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your current account level</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                user?.role === 'admin' 
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              }`}>
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}