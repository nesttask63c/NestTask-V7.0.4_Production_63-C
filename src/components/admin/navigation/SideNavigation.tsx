import { useState, useEffect } from 'react';
import { 
  Users, ListTodo, Settings, LogOut, Megaphone, Moon, Sun,
  Book, GraduationCap, FileText, CalendarDays, User, LayoutDashboard,
  BarChart2, Bell, HelpCircle, Globe
} from 'lucide-react';
import { SideNavLink } from './SideNavLink';
import { MobileMenuButton } from './MobileMenuButton';
import { useTheme } from '../../../hooks/useTheme';
import type { AdminTab } from '../../../types/admin';

interface SideNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
}

export function SideNavigation({ activeTab, onTabChange, onLogout }: SideNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'admin-tasks' as const, label: 'Admin Tasks', icon: Settings },
    { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { id: 'teachers' as const, label: 'Teachers', icon: User },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'study-materials' as const, label: 'Study Materials', icon: Book },
    { id: 'routine' as const, label: 'Routine', icon: CalendarDays }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (tab: AdminTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <MobileMenuButton isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden dark:bg-opacity-70 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out z-40 shadow-lg
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">NestTask</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </span>
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <div className="mb-4 px-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main</h2>
            </div>
            <nav className="space-y-1.5">
              {navItems.slice(0, 4).map((item) => (
                <SideNavLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeTab === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </nav>

            <div className="my-4 px-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Management</h2>
            </div>
            <nav className="space-y-1.5">
              {navItems.slice(4).map((item) => (
                <SideNavLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeTab === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </nav>
            
            <div className="mt-8 px-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  Need Help?
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">Check our documentation for answers to common questions</p>
                <button className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-xs font-medium py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 hover:shadow-sm transition-all">
                  View Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={toggle}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-3"
            >
              {isDark ? (
                <>
                  <Sun className="w-4.5 h-4.5" />
                  <span className="font-medium text-sm">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4.5 h-4.5" />
                  <span className="font-medium text-sm">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}