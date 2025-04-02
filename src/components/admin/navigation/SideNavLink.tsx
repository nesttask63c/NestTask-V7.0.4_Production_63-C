import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SideNavLinkProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  isCollapsed?: boolean;
}

export const SideNavLink = React.memo(function SideNavLink({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  badge,
  isCollapsed = false
}: SideNavLinkProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full flex items-center justify-center rounded-lg p-2.5 transition-all duration-200 relative will-change-transform
          ${isActive 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
        title={label}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        
        {badge !== undefined && (
          <span className={`
            absolute top-0 right-0.5 px-1 py-0.5 min-w-[18px] h-4.5 flex items-center justify-center text-[10px] font-medium rounded-full
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between rounded-lg py-2 px-3 transition-all duration-200 will-change-transform
        ${isActive 
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      
      {badge !== undefined && (
        <span className={`
          px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-xs font-medium rounded-full
          ${isActive 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }
        `}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});