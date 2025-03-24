import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserStats } from '../types/user';

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_stats');
      
      if (error) throw error;
      
      setStats({
        totalUsers: data.total_users,
        activeToday: data.active_today,
        newThisWeek: data.new_this_week
      });
    } catch (err: any) {
      console.error('Error fetching user stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}