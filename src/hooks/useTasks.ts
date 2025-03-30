import { useState, useEffect, useCallback } from 'react';
import { supabase, testConnection } from '../lib/supabase';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/task.service';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, getByIdFromIndexedDB, deleteFromIndexedDB, STORES, refreshUserCache } from '../utils/offlineStorage';
import type { Task, NewTask } from '../types/task';

// Extended Task type with userId for offline storage
interface OfflineTask extends Task {
  userId: string;
  updatedAt?: string;
  _isOffline?: boolean; 
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}

// Define timestamp for cached tasks data
const TASKS_CACHE_TIMESTAMP_KEY = 'tasks_last_fetched';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const isOffline = useOfflineStatus();

  const loadTasks = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      if (isOffline) {
        // If offline, get tasks from IndexedDB
        console.log('Offline mode: Loading tasks from IndexedDB');
        const offlineTasks = await getAllFromIndexedDB(STORES.TASKS);
        
        // Filter tasks for current user
        const userTasks = offlineTasks.filter((task: OfflineTask) => task.userId === userId);
        setTasks(userTasks as Task[]);
      } else {
        // Online with cache validation
        const lastFetched = localStorage.getItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`);
        const cacheAge = lastFetched ? Date.now() - parseInt(lastFetched) : Infinity;
        const cacheExpired = cacheAge > 1000 * 60 * 10; // 10 minutes cache lifetime
        
        if (forceRefresh || cacheExpired) {
          // Ensure connection is established
          const isConnected = await testConnection();
          if (!isConnected) {
            throw new Error('Unable to connect to database');
          }

          // If cache expired or force refresh, fetch from server
          console.log('Fetching fresh tasks from server');
          const data = await fetchTasks(userId);
          setTasks(data);
          
          // Store tasks in IndexedDB for offline use
          // Add userId to each task for offline filtering
          const tasksWithUserId = data.map(task => ({
            ...task,
            userId
          }));
          await saveToIndexedDB(STORES.TASKS, tasksWithUserId);
          
          // Update cache timestamp
          localStorage.setItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
        } else {
          // Use cached data for better performance
          console.log('Using cached tasks - cache age:', Math.round(cacheAge / 1000), 'seconds');
          const offlineTasks = await getAllFromIndexedDB(STORES.TASKS);
          const userTasks = offlineTasks.filter((task: OfflineTask) => task.userId === userId);
          
          if (userTasks.length > 0) {
            setTasks(userTasks as Task[]);
          } else {
            // If cache is empty, force a refresh
            const data = await fetchTasks(userId);
            setTasks(data);
            const tasksWithUserId = data.map(task => ({
              ...task,
              userId
            }));
            await saveToIndexedDB(STORES.TASKS, tasksWithUserId);
            localStorage.setItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
      
      // If online but error occurred, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          console.log('Fallback: Loading tasks from IndexedDB after online error');
          const offlineTasks = await getAllFromIndexedDB(STORES.TASKS);
          const userTasks = offlineTasks.filter((task: OfflineTask) => task.userId === userId);
          
          if (userTasks.length > 0) {
            setTasks(userTasks as Task[]);
            setError(null); // Clear error if we successfully loaded fallback data
          }
        } catch (offlineErr) {
          console.error('Error loading fallback tasks:', offlineErr);
        }
      }
      
      // Retry with exponential backoff if it's a connection error and we're online
      if (!isOffline && retryCount < 3) {
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, timeout);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, retryCount, isOffline]);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Always force refresh on initial load to ensure we have the latest data
    loadTasks(true);

    // Set up real-time subscription for tasks updates when online
    if (!isOffline) {
      const subscription = supabase
        .channel('tasks_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, () => {
          loadTasks(true); // Force refresh on database changes
        })
        .subscribe();

      // Additional event listener for page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Force refresh when the page becomes visible again
          loadTasks(true);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        supabase.removeChannel(subscription);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [userId, loadTasks, isOffline]);

  const handleCreateTask = async (newTask: NewTask) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      setError(null);
      let result: Task;
      
      if (isOffline) {
        // Create a temporary ID for offline mode
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const offlineTask: OfflineTask = {
          ...newTask,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'my-tasks', // Using valid TaskStatus value
          isAdminTask: false,
          userId, // Add userId for offline filtering
          _isOffline: true // Mark as created offline
        };
        
        // Store in IndexedDB
        await saveToIndexedDB(STORES.TASKS, offlineTask);
        
        // Update local state
        setTasks(prev => [...prev, offlineTask]);
        
        result = offlineTask;
      } else {
        // Create task online
        result = await createTask(userId, newTask);
        
        // Update local state
        setTasks(prev => [...prev, result]);
        
        // Update IndexedDB with userId
        const taskWithUserId: OfflineTask = {
          ...result,
          userId
        };
        await saveToIndexedDB(STORES.TASKS, taskWithUserId);
        
        // Update cache timestamp
        localStorage.setItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
      }
      
      return result;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Get the current task from IndexedDB
        const existingTask = await getByIdFromIndexedDB(STORES.TASKS, taskId) as OfflineTask;
        
        if (!existingTask) {
          throw new Error('Task not found');
        }
        
        // Update task locally
        const updatedTask: OfflineTask = {
          ...existingTask,
          ...updates,
          updatedAt: new Date().toISOString(),
          _isOfflineUpdated: true // Mark as updated offline
        };
        
        // Store in IndexedDB
        await saveToIndexedDB(STORES.TASKS, updatedTask);
        
        // Update local state
        setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
        
        return updatedTask as Task;
      } else {
        // Update task online
        const result = await updateTask(taskId, updates);
        
        // Update local state
        setTasks(prev => prev.map(task => task.id === taskId ? result : task));
        
        // Update IndexedDB
        const existingTask = await getByIdFromIndexedDB(STORES.TASKS, taskId) as OfflineTask;
        if (existingTask) {
          const updatedTask: OfflineTask = {
            ...existingTask,
            ...result,
            userId: existingTask.userId
          };
          await saveToIndexedDB(STORES.TASKS, updatedTask);
        }
        
        // Update cache timestamp
        if (userId) {
          localStorage.setItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
        }
        
        return result;
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, mark for deletion but don't fully delete yet
        const existingTask = await getByIdFromIndexedDB(STORES.TASKS, taskId) as OfflineTask;
        
        if (!existingTask) {
          throw new Error('Task not found');
        }
        
        // If it's a temp task (created offline), delete it immediately
        if (existingTask._isOffline) {
          await deleteFromIndexedDB(STORES.TASKS, taskId);
        } else {
          // Otherwise mark it for deletion when back online
          const markedTask = {
            ...existingTask,
            _isOfflineDeleted: true
          };
          await saveToIndexedDB(STORES.TASKS, markedTask);
        }
        
        // Update local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        // Delete task online
        await deleteTask(taskId);
        
        // Update local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
        
        // Delete from IndexedDB
        await deleteFromIndexedDB(STORES.TASKS, taskId);
        
        // Update cache timestamp
        if (userId) {
          localStorage.setItem(`${TASKS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
        }
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      throw err;
    }
  };

  // Enhanced sync function to handle all offline changes
  const syncOfflineChanges = async () => {
    if (isOffline || syncInProgress || !userId) {
      return;
    }
    
    try {
      setSyncInProgress(true);
      console.log('Starting task sync process...');
      
      // Get all tasks for current user
      const allTasks = await getAllFromIndexedDB(STORES.TASKS);
      const userTasks = allTasks.filter((task: OfflineTask) => task.userId === userId);
      let hasChanges = false;
      let syncErrors = 0;
      
      // First process deletions
      const deletedTasks = userTasks.filter((task: OfflineTask) => task._isOfflineDeleted);
      for (const task of deletedTasks) {
        try {
          // Skip temp tasks (they don't exist on server)
          if (!task._isOffline) {
            await deleteTask(task.id);
          }
          await deleteFromIndexedDB(STORES.TASKS, task.id);
          hasChanges = true;
          console.log(`Deleted task: ${task.id}`);
        } catch (err) {
          console.error(`Failed to sync delete for task ${task.id}:`, err);
          syncErrors++;
        }
      }
      
      // Then process new tasks
      const newTasks = userTasks.filter((task: OfflineTask) => task._isOffline && !task._isOfflineDeleted);
      for (const task of newTasks) {
        try {
          // Create a clean version without temp fields
          const { _isOffline, _isOfflineUpdated, _isOfflineDeleted, id, userId: _, ...taskData } = task;
          
          // Create task on server
          const newTask = await createTask(userId, taskData as NewTask);
          
          // Delete temp task and save new one
          await deleteFromIndexedDB(STORES.TASKS, task.id);
          await saveToIndexedDB(STORES.TASKS, { ...newTask, userId });
          
          hasChanges = true;
          console.log(`Created new task: ${newTask.id} (replaced temp: ${task.id})`);
        } catch (err) {
          console.error(`Failed to sync new task ${task.id}:`, err);
          syncErrors++;
        }
      }
      
      // Finally process updates
      const updatedTasks = userTasks.filter((task: OfflineTask) => task._isOfflineUpdated && !task._isOfflineDeleted && !task._isOffline);
      for (const task of updatedTasks) {
        try {
          // Create a clean version without offline flags
          const { _isOffline, _isOfflineUpdated, _isOfflineDeleted, userId: _, ...taskData } = task;
          
          // Update task on server
          await updateTask(task.id, taskData);
          
          // Update in IndexedDB without offline flags
          await saveToIndexedDB(STORES.TASKS, { ...taskData, userId, id: task.id });
          
          hasChanges = true;
          console.log(`Updated task: ${task.id}`);
        } catch (err) {
          console.error(`Failed to sync update for task ${task.id}:`, err);
          syncErrors++;
        }
      }
      
      if (hasChanges) {
        // Refresh tasks from server after sync
        await loadTasks(true);
        console.log(`Task sync completed with ${syncErrors} errors`);
      } else {
        console.log('No offline task changes to sync');
      }
      
    } catch (err) {
      console.error('Error syncing offline task changes:', err);
      setError('Failed to sync offline changes');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Function to refresh tasks with forced data reload
  const refreshTasks = useCallback(async () => {
    // Clear the cache timestamp to force a refresh
    if (userId) {
      // Use the new refreshUserCache function for more thorough cache clearing
      await refreshUserCache(userId);
    }
    return loadTasks(true);
  }, [userId, loadTasks]);

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    refreshTasks,
    syncOfflineChanges,
    isSyncing: syncInProgress,
    isOffline
  };
}