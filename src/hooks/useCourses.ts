import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  fetchStudyMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  bulkImportCourses
} from '../services/course.service';
import type { Course, NewCourse, StudyMaterial, NewStudyMaterial } from '../types/course';
import { useOfflineStatus } from './useOfflineStatus';
import { 
  saveToIndexedDB, 
  getAllFromIndexedDB, 
  getByIdFromIndexedDB, 
  clearIndexedDBStore,
  STORES 
} from '../utils/offlineStorage';

// Define cache timestamp keys
const COURSES_CACHE_TIMESTAMP_KEY = 'courses_last_fetched';
const MATERIALS_CACHE_TIMESTAMP_KEY = 'materials_last_fetched';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOffline = useOfflineStatus();

  const loadCourses = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // No need to check for forced refresh as we always load fresh data
      
      if (isOffline) {
        // When offline, get courses from IndexedDB
        console.log('Offline mode: Loading courses from IndexedDB');
        const offlineCourses = await getAllFromIndexedDB(STORES.COURSES);
        if (offlineCourses && offlineCourses.length > 0) {
          console.log('Found offline courses:', offlineCourses.length);
          setCourses(offlineCourses);
        } else {
          console.log('No offline courses found');
          setCourses([]);
        }
      } else {
        // Always fetch fresh data, no caching for admin dashboard
        console.log('Admin dashboard: Always fetching fresh course data');
        const data = await fetchCourses();
        setCourses(data);
        
        // Save courses to IndexedDB for offline use
        console.log('Saving courses to IndexedDB for offline access');
        await saveToIndexedDB(STORES.COURSES, data);
      }
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineCourses = await getAllFromIndexedDB(STORES.COURSES);
          if (offlineCourses && offlineCourses.length > 0) {
            console.log('Using cached courses due to fetch error');
            setCourses(offlineCourses);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback courses:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  const loadMaterials = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOffline) {
        // When offline, get materials from IndexedDB
        console.log('Offline mode: Loading materials from IndexedDB');
        const offlineMaterials = await getAllFromIndexedDB(STORES.MATERIALS);
        if (offlineMaterials && offlineMaterials.length > 0) {
          console.log('Found offline materials:', offlineMaterials.length);
          setMaterials(offlineMaterials);
        } else {
          console.log('No offline materials found');
          setMaterials([]);
        }
      } else {
        // Always fetch fresh data, no caching for admin dashboard
        console.log('Admin dashboard: Always fetching fresh materials data');
        const data = await fetchStudyMaterials();
        setMaterials(data);
        
        // Save materials to IndexedDB for offline use
        console.log('Saving materials to IndexedDB for offline access');
        await saveToIndexedDB(STORES.MATERIALS, data);
      }
    } catch (err: any) {
      console.error('Error loading materials:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineMaterials = await getAllFromIndexedDB(STORES.MATERIALS);
          if (offlineMaterials && offlineMaterials.length > 0) {
            console.log('Using cached materials due to fetch error');
            setMaterials(offlineMaterials);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback materials:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    loadCourses();
    loadMaterials();

    // Subscribe to changes when online
    if (!isOffline) {
      const coursesSubscription = supabase
        .channel('courses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
          loadCourses(true); // Force refresh
        })
        .subscribe();

      const materialsSubscription = supabase
        .channel('materials')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_materials' }, () => {
          loadMaterials(true); // Force refresh
        })
        .subscribe();

      return () => {
        coursesSubscription.unsubscribe();
        materialsSubscription.unsubscribe();
      };
    }
  }, [loadCourses, loadMaterials, isOffline]);

  const handleCreateCourse = async (course: NewCourse) => {
    try {
      if (isOffline) {
        // In offline mode, create a temporary course with an ID
        const tempId = `temp-course-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const offlineCourse: Course = {
          ...course,
          id: tempId,
          createdAt: new Date().toISOString(),
          createdBy: '',
          _isOffline: true // Mark as created offline
        };
        
        // Add to state and IndexedDB
        setCourses(prev => [...prev, offlineCourse]);
        await saveToIndexedDB(STORES.COURSES, offlineCourse);
        
        return offlineCourse;
      } else {
        // Online mode
        const newCourse = await createCourse(course);
        
        // Update state and IndexedDB
        setCourses(prev => [...prev, newCourse]);
        await saveToIndexedDB(STORES.COURSES, newCourse);
        
        // Update cache timestamp
        localStorage.setItem(COURSES_CACHE_TIMESTAMP_KEY, Date.now().toString());
        
        return newCourse;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      if (isOffline) {
        // In offline mode, update locally
        const existingCourse = await getByIdFromIndexedDB(STORES.COURSES, id) as Course;
        
        if (!existingCourse) {
          throw new Error('Course not found');
        }
        
        const updatedCourse = { 
          ...existingCourse, 
          ...updates, 
          _isOfflineUpdated: true 
        };
        
        // Update state and IndexedDB
        setCourses(prev => prev.map(c => c.id === id ? updatedCourse : c));
        await saveToIndexedDB(STORES.COURSES, updatedCourse);
        
        return updatedCourse;
      } else {
        // Online mode
        await updateCourse(id, updates);
        
        // Get the updated course for state and IndexedDB
        const updatedCourse = await getByIdFromIndexedDB(STORES.COURSES, id) as Course;
        if (updatedCourse) {
          const refreshedCourse = { ...updatedCourse, ...updates };
          setCourses(prev => prev.map(c => c.id === id ? refreshedCourse : c));
          await saveToIndexedDB(STORES.COURSES, refreshedCourse);
        } else {
          // If not in IndexedDB yet, fetch and update all
          await loadCourses(true);
        }
        
        // Update cache timestamp
        localStorage.setItem(COURSES_CACHE_TIMESTAMP_KEY, Date.now().toString());
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      if (isOffline) {
        // In offline mode, mark for deletion or remove if temporary
        const existingCourse = await getByIdFromIndexedDB(STORES.COURSES, id) as Course;
        
        if (existingCourse) {
          if (existingCourse._isOffline) {
            // If it's a temp course, remove it entirely
            setCourses(prev => prev.filter(c => c.id !== id));
            const allCourses = await getAllFromIndexedDB(STORES.COURSES);
            const updatedCourses = allCourses.filter((c: Course) => c.id !== id);
            await saveToIndexedDB(STORES.COURSES, updatedCourses);
          } else {
            // Otherwise mark for deletion
            const markedCourse = { ...existingCourse, _isOfflineDeleted: true };
            await saveToIndexedDB(STORES.COURSES, markedCourse);
            setCourses(prev => prev.filter(c => c.id !== id));
          }
        }
      } else {
        // ONLINE MODE - ENHANCED DELETION WORKFLOW
        console.log(`Starting enhanced deletion for course ${id}`);
        
        // 1. First update UI immediately for better UX
        setCourses(prev => prev.filter(c => c.id !== id));
        
        // 2. Delete from remote database
        await deleteCourse(id);
        
        // 3. No IndexedDB operations for admin dashboard, just load fresh data
        await loadCourses(true);
        
        console.log(`Enhanced deletion for course ${id} completed`);
      }
    } catch (err: any) {
      console.error(`Error deleting course ${id}:`, err);
      setError(err.message);
      throw err;
    }
  };

  const handleCreateMaterial = async (material: NewStudyMaterial) => {
    try {
      await createStudyMaterial(material);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<StudyMaterial>) => {
    try {
      await updateStudyMaterial(id, updates);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteStudyMaterial(id);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add the bulk import handler
  const handleBulkImportCourses = async (courses: NewCourse[]): Promise<{ success: number; errors: any[] }> => {
    try {
      if (isOffline) {
        return {
          success: 0,
          errors: [{ message: 'Bulk import is not available in offline mode' }]
        };
      }
      
      // Process the bulk import
      const result = await bulkImportCourses(courses);
      
      // Refresh the courses list
      await loadCourses(true);
      
      return result;
    } catch (error: any) {
      console.error('Error bulk importing courses:', error);
      return {
        success: 0,
        errors: [{ message: error.message || 'Failed to import courses' }]
      };
    }
  };

  return {
    courses,
    materials,
    loading,
    error,
    createCourse: handleCreateCourse,
    updateCourse: handleUpdateCourse,
    deleteCourse: handleDeleteCourse,
    createMaterial: handleCreateMaterial,
    updateMaterial: handleUpdateMaterial,
    deleteMaterial: handleDeleteMaterial,
    bulkImportCourses: handleBulkImportCourses,
    refreshCourses: () => loadCourses(true),
    refreshMaterials: () => loadMaterials(true),
    isOffline
  };
}