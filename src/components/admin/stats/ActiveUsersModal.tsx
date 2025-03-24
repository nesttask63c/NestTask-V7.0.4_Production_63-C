import { X, UserCheck, Calendar } from 'lucide-react';
import type { User } from '../../../types/auth';

interface ActiveUsersModalProps {
  users: User[];
  type: 'active' | 'new';
  onClose: () => void;
}

export function ActiveUsersModal({ users, type, onClose }: ActiveUsersModalProps) {
  const filteredUsers = users.filter(user => {
    if (!user.lastActive && !user.createdAt) return false;
    
    const now = new Date();
    
    if (type === 'active') {
      // Convert lastActive to Date object
      const lastActiveDate = user.lastActive 
        ? new Date(user.lastActive) 
        : null;
      
      if (!lastActiveDate) return false;

      // Get start and end of today in user's local timezone
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Check if the user was active anytime today
      return lastActiveDate >= startOfToday && lastActiveDate <= endOfToday;
    } else {
      // New this week - within last 7 days
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(user.createdAt) >= weekAgo;
    }
  });

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[5%] sm:top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              {type === 'active' ? (
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {type === 'active' ? 'Active Users Today' : 'New Users This Week'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                {type === 'active' ? (
                  <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <p className="text-gray-900 dark:text-white font-medium">No users found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {type === 'active' 
                  ? 'No users have been active today' 
                  : 'No new users have joined this week'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 ml-13 sm:ml-0">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    }`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(type === 'active' ? user.lastActive || user.createdAt : user.createdAt)
                        .toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
