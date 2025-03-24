import { LucideIcon } from 'lucide-react';

interface SideNavLinkProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

export function SideNavLink({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  badge
}: SideNavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md dark:from-blue-600 dark:to-indigo-600' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center transition-colors
          ${isActive
            ? 'bg-white/20' 
            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
          }
        `}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      
      {badge !== undefined && (
        <div className="mr-3">
          <span className={`
            px-1.5 py-0.5 text-xs font-medium rounded-full
            ${isActive 
              ? 'bg-white/20 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }
          `}>
            {badge}
          </span>
        </div>
      )}
    </button>
  );
}