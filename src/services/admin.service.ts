import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';
import type { UserStats } from '../types/user';

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function fetchAdminUsers(): Promise<User[]> {
  try {
    if (!await isAdmin()) {
      return [];
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role || 'user',
      createdAt: user.created_at
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function fetchAdminStats(): Promise<UserStats> {
  try {
    if (!await isAdmin()) {
      return {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0
      };
    }

    const { data, error } = await supabase.rpc('get_user_stats');
    
    if (error) throw error;
    
    return {
      totalUsers: data.total_users,
      activeToday: data.active_today,
      newThisWeek: data.new_this_week
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalUsers: 0,
      activeToday: 0,
      newThisWeek: 0
    };
  }
}