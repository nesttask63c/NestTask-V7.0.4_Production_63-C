import { Home, Calendar, Search, BookOpen } from 'lucide-react';
import { NavPage } from '../types/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';

interface BottomNavigationProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  hasUnreadNotifications: boolean;
  todayTaskCount?: number;
}

const BottomNavigationItem = React.memo(({ 
  id, 
  icon: Icon, 
  label, 
  ariaLabel, 
  isActive, 
  onClick, 
  badge 
}: { 
  id: NavPage; 
  icon: React.ElementType; 
  label: string; 
  ariaLabel: string; 
  isActive: boolean; 
  onClick: () => void; 
  badge?: number;
}) => {
  return (
    <button
      onClick={() => {
        onClick();
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      className={`
        relative flex flex-col items-center justify-center w-full h-full 
        px-2 py-2 transition-colors duration-200 ease-out
        focus:outline-none focus-visible:bg-black/5 dark:focus-visible:bg-white/10
        ${
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
    >
      <div className="relative">
        <Icon 
          className="w-5 h-5 transition-all duration-200"
          strokeWidth={isActive ? 2.5 : 1.8}
        />
        
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-red-500 rounded-full shadow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      <span className={`text-xs font-medium mt-1 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
    </button>
  );
});

BottomNavigationItem.displayName = 'BottomNavigationItem';

export function BottomNavigation({ activePage, onPageChange, hasUnreadNotifications, todayTaskCount = 0 }: BottomNavigationProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const currentIndex = navItems.findIndex(item => item.id === activePage);
      
      if (e.key === 'ArrowRight' && currentIndex < navItems.length - 1) {
        onPageChange(navItems[currentIndex + 1].id);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onPageChange(navItems[currentIndex - 1].id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, onPageChange]);

  // Handle swipe navigation for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Minimum swipe distance (50px)
    if (Math.abs(diff) < 50) return;
    
    const currentIndex = navItems.findIndex(item => item.id === activePage);
    
    // Swipe right to left (next)
    if (diff > 0 && currentIndex < navItems.length - 1) {
      onPageChange(navItems[currentIndex + 1].id);
    } 
    // Swipe left to right (previous)
    else if (diff < 0 && currentIndex > 0) {
      onPageChange(navItems[currentIndex - 1].id);
    }
    
    setTouchStartX(null);
  }, [touchStartX, activePage, onPageChange]);

  const navItems = useMemo(() => [
    { id: 'home' as NavPage, icon: Home, label: 'Home', ariaLabel: 'Go to home page', badge: undefined },
    { id: 'upcoming' as NavPage, icon: Calendar, label: 'Upcoming', ariaLabel: 'View upcoming tasks', badge: todayTaskCount > 0 ? todayTaskCount : undefined },
    { id: 'routine' as NavPage, icon: BookOpen, label: 'Routine', ariaLabel: 'View your routine', badge: undefined },
    { id: 'search' as NavPage, icon: Search, label: 'Search', ariaLabel: 'Search content', badge: undefined }
  ], [todayTaskCount]);

  const activeIndex = navItems.findIndex(item => item.id === activePage);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-md"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 h-16">
          {/* Active indicator line */}
          <div className="absolute top-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-200" 
            style={{
              width: `${100 / navItems.length}%`,
              left: `${(100 / navItems.length) * activeIndex}%`,
            }}
          />

          {navItems.map(({ id, icon, label, ariaLabel, badge }) => (
            <BottomNavigationItem
              key={id}
              id={id}
              icon={icon}
              label={label}
              ariaLabel={ariaLabel}
              isActive={activePage === id}
              onClick={() => onPageChange(id)}
              badge={badge}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}