import { useState, useEffect } from 'react';
import { fetchUsers, deleteUser } from '../services/user.service';
import type { User } from '../types/auth';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setError(null);
      await deleteUser(userId);
      await loadUsers(); // Reload the users list after deletion
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    refresh: loadUsers,
    deleteUser: handleDeleteUser
  };
}