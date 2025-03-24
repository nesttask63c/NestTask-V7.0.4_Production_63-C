import { Bell, Check } from 'lucide-react';
import { NotificationItem } from '../components/notifications/NotificationItem';
import type { Notification } from '../hooks/useNotifications';

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: (id: string) => void;
}

export function NotificationsPage({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear
}: NotificationsPageProps) {
  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            No notifications yet
          </h2>
          <p className="text-gray-500">
            We'll notify you when there are new tasks or updates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onClear={onClear}
            />
          ))}
        </div>
      )}
    </div>
  );
}