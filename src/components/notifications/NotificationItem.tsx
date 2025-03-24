import { Check, Trash2, Megaphone, AlertCircle, Bell } from 'lucide-react';
import type { Notification } from '../../hooks/useNotifications';
import { parseLinks } from '../../utils/linkParser';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onClear }: NotificationItemProps) {
  // Parse links in the message
  const messageParts = parseLinks(notification.message);

  return (
    <div
      className={`
        group bg-white dark:bg-gray-800 rounded-2xl p-4 transition-all duration-200
        ${!notification.read 
          ? 'shadow-lg ring-1 ring-blue-100 dark:ring-blue-900/30' 
          : 'shadow hover:shadow-md'
        }
      `}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`
          p-2 rounded-xl h-fit
          ${notification.isAnnouncement 
            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' 
            : notification.isAdminTask
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }
        `}>
          {notification.isAnnouncement ? (
            <Megaphone className="w-5 h-5" />
          ) : notification.isAdminTask ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {notification.title}
            </h3>
            {notification.isAnnouncement && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                Announcement
              </span>
            )}
            {notification.isAdminTask && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                Admin
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 break-words">
            {messageParts.map((part, index) => 
              part.type === 'link' ? (
                <a
                  key={index}
                  href={part.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part.content}
                </a>
              ) : (
                <span key={index}>{part.content}</span>
              )
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(notification.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
            
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Mark as read</span>
                </button>
              )}
              <button
                onClick={() => onClear(notification.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                title="Clear notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
