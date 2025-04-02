import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, ListTodo, Settings, LogOut, Megaphone, Moon, Sun,
  Book, GraduationCap, FileText, CalendarDays, User, LayoutDashboard,
  BarChart2, Bell, HelpCircle, Globe, AlertCircle, ChevronLeft,
  MessageCircle, Search, CheckCircle, Clock, Plus
} from 'lucide-react';
import { SideNavLink } from './SideNavLink';
import { MobileMenuButton } from './MobileMenuButton';
import { useTheme } from '../../../hooks/useTheme';
import type { AdminTab } from '../../../types/admin';

interface SideNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onCollapse?: (collapsed: boolean) => void;
}

export const SideNavigation = React.memo(function SideNavigation({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  onCollapse 
}: SideNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  // Memoize navigation items to prevent rerenders
  const mainNavItems = useMemo(() => [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users, badge: 147 },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo, badge: 56 },
    { id: 'due-tasks' as const, label: 'Due Tasks', icon: Clock, badge: 14 },
  ], []);
  
  const managementNavItems = useMemo(() => [
    { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { id: 'teachers' as const, label: 'Teachers', icon: User },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'study-materials' as const, label: 'Study Materials', icon: Book },
    { id: 'routine' as const, label: 'Routine', icon: CalendarDays }
  ], []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigation = useCallback((tab: AdminTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  }, [onTabChange]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      // Notify parent component of sidebar collapse state
      if (onCollapse) {
        onCollapse(newState);
      }
      return newState;
    });
  }, [onCollapse]);

  const handleThemeToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  return (
    <>
      <MobileMenuButton isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden dark:bg-opacity-70 backdrop-blur-sm will-change-transform"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transform transition-all duration-300 ease-in-out z-40 shadow-sm will-change-transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b border-gray-100 dark:border-gray-800 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">TaskMon</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            )}
            
            <button 
              onClick={toggleCollapse} 
              className={`${isCollapsed ? 'hidden lg:flex' : 'hidden lg:flex'} items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              <ChevronLeft className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 px-3 overflow-y-auto">
            {!isCollapsed && (
              <div className="mb-3 px-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main</h2>
              </div>
            )}
            
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <SideNavLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeTab === item.id}
                  onClick={() => handleNavigation(item.id)}
                  badge={item.badge}
                  isCollapsed={isCollapsed}
                />
              ))}
            </nav>

            {!isCollapsed && (
              <div className="my-3 px-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Management</h2>
              </div>
            )}
            
            {isCollapsed && <div className="my-3 border-t border-gray-100 dark:border-gray-800 mx-2"></div>}
            
            <nav className="space-y-1">
              {managementNavItems.map((item) => (
                <SideNavLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeTab === item.id}
                  onClick={() => handleNavigation(item.id)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </nav>
            
            {!isCollapsed && (
              <div className="mt-6 mx-2">
                <button 
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => handleNavigation('tasks')}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            )}
            
            {isCollapsed && (
              <div className="mt-6 flex justify-center">
                <button 
                  className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  onClick={() => handleNavigation('tasks')}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">Admin User</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</span>
                  </div>
                </div>
              )}
              
              {isCollapsed && (
                <div className="w-10 h-10 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              
              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleThemeToggle}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});