import { useState, useEffect } from 'react';
import { fetchAdminUsers, fetchAdminStats, isAdmin } from '../services/admin.service';
import type { User } from '../types/auth';
import type { UserStats } from '../types/user';

export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdmin();
    setIsAdminUser(adminStatus);
    if (adminStatus) {
      await Promise.all([
        loadUsers(),
        loadStats()
      ]);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const data = await fetchAdminUsers();
    setUsers(data);
  };

  const loadStats = async () => {
    const data = await fetchAdminStats();
    setStats(data);
  };

  return {
    users,
    stats,
    loading,
    isAdmin: isAdminUser,
    refresh: async () => {
      if (isAdminUser) {
        await Promise.all([
          loadUsers(),
          loadStats()
        ]);
      }
    }
  };
}