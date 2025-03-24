import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';
import type { UserStats } from '../types/user';

export async function fetchUsers(): Promise<User[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.user_metadata?.role || user.user_metadata.role !== 'admin') {
      console.warn('Non-admin user attempted to fetch users');
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, last_active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data?.map(user => ({
      id: user.id,
      email: user.email || '',
      name: user.name || user.email?.split('@')[0] || '',
      role: user.role || 'user',
      createdAt: user.created_at,
      lastActive: user.last_active
    })) || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.user_metadata?.role || user.user_metadata.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete users');
    }

    // Call the delete_user RPC function
    const { error } = await supabase.rpc('delete_user', {
      user_id: userId
    });

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
}

export async function fetchUserStats(): Promise<UserStats> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.user_metadata?.role || user.user_metadata.role !== 'admin') {
      return {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0
      };
    }

    const { data, error } = await supabase.rpc('get_user_stats');
    
    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0
      };
    }
    
    return {
      totalUsers: data.total_users || 0,
      activeToday: data.active_today || 0,
      newThisWeek: data.new_this_week || 0
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