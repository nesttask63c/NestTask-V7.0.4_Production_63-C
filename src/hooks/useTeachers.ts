import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher,
  bulkImportTeachers as bulkImportTeachersService,
  TeacherBulkImportItem
} from '../services/teacher.service';
import type { Teacher, NewTeacher } from '../types/teacher';
import type { Course } from '../types/course';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, getByIdFromIndexedDB, STORES } from '../utils/offlineStorage';

// Define cache timestamp key
const TEACHERS_CACHE_TIMESTAMP_KEY = 'teachers_last_fetched';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOffline = useOfflineStatus();

  const loadTeachers = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOffline) {
        // When offline, get teachers from IndexedDB
        console.log('Offline mode: Loading teachers from IndexedDB');
        const offlineTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
        if (offlineTeachers && offlineTeachers.length > 0) {
          console.log('Found offline teachers:', offlineTeachers.length);
          setTeachers(offlineTeachers);
        } else {
          console.log('No offline teachers found');
          setTeachers([]);
        }
      } else {
        // Always fetch fresh data, no caching for admin dashboard
        console.log('Admin dashboard: Always fetching fresh teacher data');
        const data = await fetchTeachers();
        setTeachers(data);
        
        // No longer saving to IndexedDB for admin dashboard
      }
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
          if (offlineTeachers && offlineTeachers.length > 0) {
            console.log('Using cached teachers due to fetch error');
            setTeachers(offlineTeachers);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback teachers:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    loadTeachers();

    // Subscribe to changes when online
    if (!isOffline) {
      const subscription = supabase
        .channel('teachers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teachers'
          },
          () => {
            loadTeachers(true);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadTeachers, isOffline]);

  const handleCreateTeacher = async (teacher: NewTeacher, courseIds: string[]) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, check for duplicate names before creating
        const existingTeachers = await getAllFromIndexedDB(STORES.TEACHERS) as Teacher[];
        const duplicateTeacher = existingTeachers.find(t => 
          t.name.toLowerCase() === teacher.name.toLowerCase() && !t._isOfflineDeleted
        );
        
        if (duplicateTeacher) {
          throw new Error(`A teacher with the name "${teacher.name}" already exists.`);
        }
        
        // In offline mode, create a temporary teacher with an ID
        const tempId = `temp-teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const offlineTeacher: Teacher = {
          ...teacher,
          id: tempId,
          createdAt: new Date().toISOString(),
          createdBy: '',
          courses: courseIds.map(id => ({ id, name: '', code: '' } as Course)),
          _isOffline: true // Mark as created offline
        };
        
        // Add to state and IndexedDB
        setTeachers(prev => [...prev, offlineTeacher]);
        await saveToIndexedDB(STORES.TEACHERS, offlineTeacher);
        
        return offlineTeacher;
      } else {
        // Online mode
        await createTeacher(teacher, courseIds);
        await loadTeachers(true);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateTeacher = async (id: string, updates: Partial<Teacher>, courseIds: string[]) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update locally
        const existingTeacher = await getByIdFromIndexedDB(STORES.TEACHERS, id) as Teacher;
        
        if (!existingTeacher) {
          throw new Error('Teacher not found');
        }
        
        // If the name is being updated, check for duplicates
        if (updates.name && updates.name !== existingTeacher.name) {
          const allTeachers = await getAllFromIndexedDB(STORES.TEACHERS) as Teacher[];
          const duplicateTeacher = allTeachers.find(t => 
            t.id !== id && 
            t.name.toLowerCase() === updates.name?.toLowerCase() && 
            !t._isOfflineDeleted
          );
          
          if (duplicateTeacher) {
            throw new Error(`A teacher with the name "${updates.name}" already exists.`);
          }
        }
        
        const updatedTeacher: Teacher = { 
          ...existingTeacher, 
          ...updates, 
          courses: courseIds.map(id => ({ id, name: '', code: '' } as Course)),
          _isOfflineUpdated: true 
        };
        
        // Update state and IndexedDB
        setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
        await saveToIndexedDB(STORES.TEACHERS, updatedTeacher);
        
        return updatedTeacher;
      } else {
        // Online mode
        await updateTeacher(id, updates, courseIds);
        await loadTeachers(true);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      setError(null);
      
      // Immediately remove teacher from state for better UI responsiveness
      setTeachers(prev => prev.filter(t => t.id !== id));
      
      if (isOffline) {
        // Immediately remove from IndexedDB in offline mode only
        try {
          const allTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
          const updatedTeachers = allTeachers.filter((t: Teacher) => t.id !== id);
          await saveToIndexedDB(STORES.TEACHERS, updatedTeachers);
          console.log(`Teacher ${id} removed from local cache`);
        } catch (cacheError) {
          console.error('Error updating local cache:', cacheError);
        }
        
        // In offline mode, mark for deletion or remove if temporary
        const existingTeacher = await getByIdFromIndexedDB(STORES.TEACHERS, id) as Teacher;
        
        if (existingTeacher) {
          if (existingTeacher._isOffline) {
            // Already handled above - teacher removed from IndexedDB
            console.log(`Offline teacher ${id} removed`);
          } else {
            // Mark for deletion when back online
            const markedTeacher = { ...existingTeacher, _isOfflineDeleted: true };
            await saveToIndexedDB(STORES.TEACHERS, markedTeacher);
            console.log(`Teacher ${id} marked for deletion when online`);
          }
        }
      } else {
        // Online mode - attempt database deletion
        try {
          console.log(`Initiating deletion of teacher with ID: ${id} from database`);
          
          // Call the service function to delete the teacher
          await deleteTeacher(id);
          
          console.log(`Teacher ${id} successfully deleted from database`);
          
          // No need to update state or IndexedDB again - already done above
          
        } catch (deleteError: any) {
          console.error('Error in teacher deletion operation:', deleteError);
          setError(`Failed to delete teacher: ${deleteError.message || 'Unknown error'}`);
          // Don't throw here - we've already updated the UI
          // Deletion will be retried when sync happens
        }
      }
      
      // Force a refresh from the database after a small delay to ensure consistency
      setTimeout(() => {
        loadTeachers(true);
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete teacher');
      throw err;
    }
  };

  const handleBulkImportTeachers = async (teachersData: TeacherBulkImportItem[]) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, we'll create temporary teachers
        let successCount = 0;
        const errors: { index: number; error: string }[] = [];
        
        for (let i = 0; i < teachersData.length; i++) {
          try {
            const item = teachersData[i];
            
            if (!item.teacher_name) {
              errors.push({ index: i, error: 'Teacher name is required' });
              continue;
            }
            
            // Create a temporary offline teacher
            const tempId = `temp-teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const offlineTeacher: Teacher = {
              id: tempId,
              name: item.teacher_name,
              email: item.email || '',
              phone: item.phone || 'N/A',
              department: item.department || '',
              createdAt: new Date().toISOString(),
              createdBy: '',
              courses: [], // We can't easily match courses offline
              _isOffline: true
            };
            
            // Add to state and IndexedDB
            setTeachers(prev => [...prev, offlineTeacher]);
            await saveToIndexedDB(STORES.TEACHERS, offlineTeacher);
            
            successCount++;
          } catch (err: any) {
            errors.push({ index: i, error: err.message || 'Unknown error' });
          }
        }
        
        return { success: successCount, errors };
      } else {
        // Online mode
        const result = await bulkImportTeachersService(teachersData);
        await loadTeachers(true);
        return result;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    teachers,
    loading,
    error,
    createTeacher: handleCreateTeacher,
    updateTeacher: handleUpdateTeacher,
    deleteTeacher: handleDeleteTeacher,
    bulkImportTeachers: handleBulkImportTeachers,
    refreshTeachers: () => loadTeachers(true),
    isOffline
  };
}