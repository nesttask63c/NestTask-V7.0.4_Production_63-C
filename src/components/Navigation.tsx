import { useState, useCallback } from 'react';
import { ProfileMenu } from './profile/ProfileMenu';
import { NotificationBadge } from './notifications/NotificationBadge';
import { Layout, Moon, Sun, Calendar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { SlidingNavigation } from './navigation/SlidingNavigation';
import { MonthlyCalendar } from './MonthlyCalendar';
import type { NavPage } from '../types/navigation';
import type { Task } from '../types/task';

interface NavigationProps {
  onLogout: () => void;
  hasUnreadNotifications: boolean;
  onNotificationsClick: () => void;
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  taskStats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  tasks: Task[];
}

export function Navigation({ 
  onLogout, 
  hasUnreadNotifications, 
  onNotificationsClick,
  activePage,
  onPageChange,
  user,
  taskStats,
  tasks = []
}: NavigationProps) {
  const { isDark, toggle } = useTheme();
  const [isSlidingNavOpen, setIsSlidingNavOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleCalendarToggle = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // We'll just use click events which work for both mouse and touch
  // without needing to preventDefault()

  const handleDateSelect = (date: Date) => {
    // Update local state
    setSelectedDate(date);
    setIsCalendarOpen(false);
    
    // Always navigate to upcoming page
    onPageChange('upcoming');
    
    try {
      // Optimize date formatting - direct string extraction is faster than string padding
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // Format with ternary operators for better performance
      const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      // Use URLSearchParams constructor directly with an object for better performance
      const params = new URLSearchParams(window.location.search);
      params.set('selectedDate', formattedDate);
      
      // Force URL update with correct date parameter
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ path: newUrl, date: formattedDate }, '', newUrl);
      
      // Dispatch a custom event to notify other components
      const dateSelectedEvent = new CustomEvent('dateSelected', { detail: { date } });
      window.dispatchEvent(dateSelectedEvent);
      
      // For debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Navigation: Selected date and updated URL', formattedDate);
      }
    } catch (error) {
      console.error('Error setting date parameter:', error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-14">
              {/* Logo and Brand */}
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => setIsSlidingNavOpen(true)}
                  className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60 rounded-lg p-1.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                  aria-label="Open navigation menu"
                >
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20 dark:shadow-blue-600/10 group-hover:shadow-blue-500/30 dark:group-hover:shadow-blue-500/20 transition-all duration-300">
                    <Layout className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300">
                    NestTask
                  </h1>
                </button>
              </div>

              {/* Right Section - Action Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                {/* Theme Toggle Button */}
                <div className="relative flex items-center">
                  <button
                    onClick={toggle}
                    className="p-2 rounded-lg bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 touch-manipulation hover:shadow-sm"
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                {/* Calendar Button */}
                <div className="relative flex items-center">
                  <button
                    onClick={handleCalendarToggle}
                    className="p-2 rounded-lg bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 touch-manipulation hover:shadow-sm"
                    aria-label="Show calendar"
                  >
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  </button>
                </div>

                {/* Notification Badge */}
                <div className="relative flex items-center">
                  <button
                    onClick={onNotificationsClick}
                    className="p-2 rounded-lg bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 relative touch-manipulation hover:shadow-sm"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4 text-gray-700 dark:text-gray-300" strokeWidth={1.75} />
                    {hasUnreadNotifications && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800" />
                    )}
                  </button>
                </div>

                {/* Profile Menu */}
                <div className="ml-1">
                  <ProfileMenu onLogout={onLogout} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sliding Navigation */}
      <SlidingNavigation
        isOpen={isSlidingNavOpen}
        onClose={() => setIsSlidingNavOpen(false)}
        activePage={activePage}
        onPageChange={onPageChange}
        onLogout={onLogout}
        user={user}
        taskStats={taskStats}
      />

      {/* Monthly Calendar */}
      <MonthlyCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        tasks={tasks}
      />
    </>
  );
}

// Bell icon component for notifications
function Bell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}