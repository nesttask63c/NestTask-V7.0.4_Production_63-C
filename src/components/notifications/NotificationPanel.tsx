import { X, CheckCircle, Bell, Check, Megaphone, AlertCircle } from 'lucide-react';
import { parseLinks } from '../../utils/linkParser';
import type { Notification } from '../../hooks/useNotifications';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: (id: string) => void;
}

export function NotificationPanel({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear
}: NotificationPanelProps) {
  const hasUnread = notifications.some(n => !n.read);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className={`
        fixed z-50 transition-all duration-300 ease-in-out
        inset-x-0 bottom-0 top-20 
        md:right-4 md:left-auto md:top-20 md:w-[28rem] 
        bg-gray-50 dark:bg-gray-900
        rounded-t-3xl md:rounded-2xl 
        shadow-2xl
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-t-2xl border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hasUnread ? `${notifications.filter(n => !n.read).length} unread messages` : 'No unread messages'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:block">Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">All caught up!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No notifications to show right now
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const messageParts = parseLinks(notification.message);
              
              return (
                <div
                  key={notification.id}
                  className={`
                    relative bg-white dark:bg-gray-800 rounded-2xl p-4 transition-all duration-200
                    ${!notification.read 
                      ? 'shadow-lg ring-1 ring-blue-100 dark:ring-blue-900/30' 
                      : 'shadow hover:shadow-md opacity-75 hover:opacity-100'
                    }
                  `}
                >
                  {!notification.read && (
                    <div className="absolute right-4 top-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                  
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
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onClear(notification.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                            title="Clear notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile-only bottom safe area */}
        <div className="h-6 md:hidden" />
      </div>
    </>
  );
}
