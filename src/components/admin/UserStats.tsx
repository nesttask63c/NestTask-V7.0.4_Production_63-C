import { useState } from 'react';
import { Users, UserCheck, Clock, ListTodo } from 'lucide-react';
import { useUserStats } from '../../hooks/useUserStats';
import { UserStatsCard } from './stats/UserStatsCard';
import { UserDetailsModal } from './users/UserDetailsModal';
import { TaskDetailsModal } from './task/TaskDetailsModal';
import { ActiveUsersModal } from './stats/ActiveUsersModal';
import type { User } from '../../types/auth';
import type { Task } from '../../types';

interface UserStatsProps {
  users: User[];
  tasks: Task[];
}

export function UserStats({ users, tasks }: UserStatsProps) {
  const { stats, loading } = useUserStats();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState<'active' | 'new' | null>(null);

  // Filter active users based on lastActive timestamp
  const getActiveUsers = () => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    return users.filter(user => {
      if (!user.lastActive) return false;
      const lastActiveDate = new Date(user.lastActive);
      return lastActiveDate >= startOfToday;
    });
  };

  // Filter new users from the past week
  const getNewUsers = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return users.filter(user => new Date(user.createdAt) >= weekAgo);
  };

  const activeUsers = getActiveUsers();
  const newUsers = getNewUsers();

  const statCards = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'blue' as const,
      onClick: () => setShowUserDetails(true)
    },
    {
      title: 'Active Today',
      value: activeUsers.length,
      icon: UserCheck,
      color: 'green' as const,
      onClick: () => setShowActiveUsers('active')
    },
    {
      title: 'New This Week',
      value: newUsers.length,
      icon: Clock,
      color: 'purple' as const,
      onClick: () => setShowActiveUsers('new')
    },
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: ListTodo,
      color: 'indigo' as const,
      onClick: () => setShowTaskDetails(true)
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <UserStatsCard
            key={card.title}
            {...card}
            loading={loading}
          />
        ))}
      </div>

      {showUserDetails && (
        <UserDetailsModal
          users={users}
          onClose={() => setShowUserDetails(false)}
        />
      )}

      {showTaskDetails && (
        <TaskDetailsModal
          tasks={tasks}
          onClose={() => setShowTaskDetails(false)}
        />
      )}

      {showActiveUsers && (
        <ActiveUsersModal
          users={showActiveUsers === 'active' ? activeUsers : newUsers}
          type={showActiveUsers}
          onClose={() => setShowActiveUsers(null)}
        />
      )}
    </>
  );
}
