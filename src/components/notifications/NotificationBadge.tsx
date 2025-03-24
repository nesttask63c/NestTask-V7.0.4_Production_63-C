import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  hasUnread: boolean;
  onClick: () => void;
}

export function NotificationBadge({ hasUnread, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 relative"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
      {hasUnread && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
      )}
    </button>
  );
}