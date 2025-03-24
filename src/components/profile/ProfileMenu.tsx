import { useState } from 'react';
import { User, LogOut, Code, Settings, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DeveloperModal } from './DeveloperModal';
import { SettingsModal } from '../settings/SettingsModal';

interface ProfileMenuProps {
  onLogout: () => void;
}

export function ProfileMenu({ onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'developer',
      label: 'Developer',
      icon: Code,
      description: 'API Access & Documentation',
      onClick: () => {
        setIsOpen(false);
        setShowDeveloperModal(true);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences & Security',
      onClick: () => {
        setIsOpen(false);
        setShowSettingsModal(true);
      }
    },
    ...(user?.role === 'admin' ? [{
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      description: 'System Management',
      onClick: () => console.log('Admin clicked')
    }] : [])
  ];

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 hover:shadow-sm"
        aria-label="Open profile menu"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
          {userInitial}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-20 animate-scale-in origin-top-right divide-y divide-gray-100 dark:divide-gray-700">
            {/* Profile Section */}
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md text-lg font-semibold">
                  {userInitial}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{user?.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="p-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-grow text-left">
                    <div className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>

            {/* Logout Section */}
            <div className="p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div className="flex-grow text-left">
                  <div className="font-medium text-sm">Logout</div>
                  <div className="text-xs text-red-500 dark:text-red-400">End your session</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {showDeveloperModal && (
        <DeveloperModal onClose={() => setShowDeveloperModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}