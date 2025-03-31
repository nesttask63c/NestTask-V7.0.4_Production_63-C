import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchRoutines,
  createRoutine as createRoutineService,
  updateRoutine as updateRoutineService,
  deleteRoutine as deleteRoutineService,
  addRoutineSlot as addRoutineSlotService,
  updateRoutineSlot as updateRoutineSlotService,
  deleteRoutineSlot as deleteRoutineSlotService,
  activateRoutine as activateRoutineService,
  deactivateRoutine as deactivateRoutineService,
  bulkImportRoutineSlots as bulkImportRoutineSlotsService,
  exportRoutineWithSlots as exportRoutineWithSlotsService,
  getAllSemesters as getAllSemestersService,
  getRoutinesBySemester as getRoutinesBySemesterService
} from '../services/routine.service';
import type { Routine, RoutineSlot } from '../types/routine';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, STORES, getByIdFromIndexedDB, clearIndexedDBStore } from '../utils/offlineStorage';

// Define timestamp for cached data
const CACHE_TIMESTAMP_KEY = 'routines_last_fetched';

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const isOffline = useOfflineStatus();

  // Improved load routines function with cache validation
  const loadRoutines = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOffline) {
        // When offline, get routines from IndexedDB
        console.log('Offline mode: Loading routines from IndexedDB');
        const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        
        if (offlineRoutines && offlineRoutines.length > 0) {
          console.log('Found offline routines:', offlineRoutines.length);
          setRoutines(offlineRoutines);
        } else {
          console.log('No offline routines found');
          setRoutines([]);
        }
      } else {
        // Check cache validity and only fetch if necessary
        const lastFetchedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const currentTime = Date.now();
        const cacheDurationMs = 5 * 60 * 1000; // 5 minutes cache duration
        const isCacheValid = lastFetchedTimestamp && 
                            (currentTime - parseInt(lastFetchedTimestamp)) < cacheDurationMs;
        
        // Skip fetch if cache is valid and not forcing refresh
        if (isCacheValid && !forceRefresh) {
          console.log('Using cached routines data (valid for 5 minutes)');
          const cachedRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          if (cachedRoutines && cachedRoutines.length > 0) {
            setRoutines(cachedRoutines);
            setLoading(false);
            return;
          }
        }
        
        // Fetch fresh data if cache is invalid or forced refresh
        console.log('Fetching fresh routine data from server');
        const data = await fetchRoutines();
        
        // Update local state
        setRoutines(data);
        
        // Update cache timestamp and save to IndexedDB
        localStorage.setItem(CACHE_TIMESTAMP_KEY, currentTime.toString());
        await saveToIndexedDB(STORES.ROUTINES, data);
      }
    } catch (err: any) {
      console.error('Error loading routines:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          if (offlineRoutines && offlineRoutines.length > 0) {
            console.log('Using cached routines due to fetch error');
            setRoutines(offlineRoutines);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback routines:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  // New function to prefetch related data for faster loading
  const prefetchRoutineData = useCallback(async () => {
    if (isOffline) return; // Don't prefetch when offline
    
    try {
      console.log('Prefetching routine-related data for faster access');
      
      // Prefetch courses and teachers in parallel
      await Promise.all([
        supabase.from('courses').select('id,name,code'),
        supabase.from('teachers').select('id,name')
      ]);
      
      console.log('Prefetch completed successfully');
    } catch (err) {
      console.error('Error prefetching routine data:', err);
      // Silent failure - this is just an optimization
    }
  }, [isOffline]);

  // Add prefetch call to the main effect
  useEffect(() => {
    loadRoutines();
    prefetchRoutineData(); // Prefetch related data while loading routines

    // Only subscribe to changes when online
    if (!isOffline) {
      const subscription = supabase
        .channel('routines')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'routines'
          },
          () => {
            loadRoutines(true); // Force refresh on database changes
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOffline, loadRoutines, prefetchRoutineData]);

  // Enhanced offline sync with improved progress tracking and error handling
  const syncOfflineChanges = async () => {
    if (isOffline || syncInProgress) return; // Only sync when online and not already syncing
    
    try {
      setSyncInProgress(true);
      console.log('Starting routine sync process...');
      
      const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
      let syncedRoutines = [...offlineRoutines];
      let hasChanges = false;
      let syncErrors = 0;
      
      // Process each routine for offline changes
      for (const routine of offlineRoutines) {
        // Skip routines without offline changes
        if (!routine._isOffline && 
            !routine._isOfflineUpdated && 
            !routine._isOfflineDeleted && 
            !routine._needsActivationSync && 
            !routine._needsDeactivationSync && 
            !routine.slots?.some((slot: RoutineSlot) => slot._isOffline || slot._isOfflineUpdated || slot._isOfflineDeleted)) {
          continue;
        }
        
        console.log(`Syncing routine: ${routine.id} (${routine.name})`);
        
        // Handle routine deletions
        if (routine._isOfflineDeleted) {
          try {
            await deleteRoutineService(routine.id);
            syncedRoutines = syncedRoutines.filter(r => r.id !== routine.id);
            hasChanges = true;
            console.log(`Deleted routine: ${routine.id}`);
          } catch (err) {
            console.error(`Failed to sync delete for routine ${routine.id}:`, err);
            syncErrors++;
          }
          continue;
        }
        
        // Handle activation/deactivation
        if (routine._needsActivationSync) {
          try {
            await activateRoutineService(routine.id);
            const routineIndex = syncedRoutines.findIndex(r => r.id === routine.id);
            if (routineIndex >= 0) {
              syncedRoutines[routineIndex] = { 
                ...syncedRoutines[routineIndex], 
                isActive: true,
                _needsActivationSync: undefined 
              };
              hasChanges = true;
            }
            console.log(`Activated routine: ${routine.id}`);
          } catch (err) {
            console.error(`Failed to sync activation for routine ${routine.id}:`, err);
            syncErrors++;
          }
        } else if (routine._needsDeactivationSync) {
          try {
            await deactivateRoutineService(routine.id);
            const routineIndex = syncedRoutines.findIndex(r => r.id === routine.id);
            if (routineIndex >= 0) {
              syncedRoutines[routineIndex] = { 
                ...syncedRoutines[routineIndex], 
                isActive: false,
                _needsDeactivationSync: undefined 
              };
              hasChanges = true;
            }
            console.log(`Deactivated routine: ${routine.id}`);
          } catch (err) {
            console.error(`Failed to sync deactivation for routine ${routine.id}:`, err);
            syncErrors++;
          }
        }
        
        // Handle new routines created offline
        if (routine._isOffline) {
          try {
            // Remove offline flags and generate clean data
            const { _isOffline, id, ...routineData } = routine;
            const newRoutine = await createRoutineService(routineData);
            
            // Replace the temp routine with the server one
            syncedRoutines = syncedRoutines.filter(r => r.id !== routine.id);
            syncedRoutines.push(newRoutine);
            hasChanges = true;
            console.log(`Created new routine: ${newRoutine.id} (replaced temp: ${routine.id})`);
          } catch (err) {
            console.error(`Failed to sync new routine ${routine.id}:`, err);
            syncErrors++;
          }
          continue;
        }
        
        // Handle routine updates
        if (routine._isOfflineUpdated) {
          try {
            // Create a clean version without offline flags
            const { _isOfflineUpdated, _isOffline, _needsActivationSync, _needsDeactivationSync, slots, ...routineData } = routine;
            await updateRoutineService(routine.id, routineData);
            
            // Update the synced version
            const index = syncedRoutines.findIndex(r => r.id === routine.id);
            if (index >= 0) {
              syncedRoutines[index] = { 
                ...syncedRoutines[index], 
                ...routineData,
                _isOfflineUpdated: undefined 
              };
              hasChanges = true;
            }
            console.log(`Updated routine: ${routine.id}`);
          } catch (err) {
            console.error(`Failed to sync routine update ${routine.id}:`, err);
            syncErrors++;
          }
        }
        
        // Handle slot changes
        if (routine.slots && routine.slots.length > 0) {
          let slotsChanged = false;
          const syncedSlots = [...routine.slots];
          
          for (const slot of routine.slots) {
            // Skip slots without offline changes
            if (!slot._isOffline && !slot._isOfflineUpdated && !slot._isOfflineDeleted) {
              continue;
            }
            
            // Handle slot deletions
            if (slot._isOfflineDeleted) {
              try {
                await deleteRoutineSlotService(routine.id, slot.id);
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots.splice(slotIndex, 1);
                  slotsChanged = true;
                }
                console.log(`Deleted slot: ${slot.id} from routine: ${routine.id}`);
              } catch (err) {
                console.error(`Failed to sync slot deletion ${slot.id}:`, err);
                syncErrors++;
              }
              continue;
            }
            
            // Handle new slots
            if (slot._isOffline) {
              try {
                const { _isOffline, id, routineId, createdAt, ...slotData } = slot;
                const newSlot = await addRoutineSlotService(routine.id, slotData);
                
                // Replace temp slot with server one
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots[slotIndex] = newSlot;
                  slotsChanged = true;
                }
                console.log(`Created new slot: ${newSlot.id} (replaced temp: ${slot.id})`);
              } catch (err) {
                console.error(`Failed to sync new slot ${slot.id}:`, err);
                syncErrors++;
              }
              continue;
            }
            
            // Handle slot updates
            if (slot._isOfflineUpdated) {
              try {
                const { _isOfflineUpdated, _isOffline, ...slotData } = slot;
                await updateRoutineSlotService(routine.id, slot.id, slotData);
                
                // Update slot in synced version
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots[slotIndex] = { 
                    ...slotData, 
                    id: slot.id, 
                    routineId: routine.id,
                    _isOfflineUpdated: undefined
                  };
                  slotsChanged = true;
                }
                console.log(`Updated slot: ${slot.id}`);
              } catch (err) {
                console.error(`Failed to sync slot update ${slot.id}:`, err);
                syncErrors++;
              }
            }
          }
          
          // Update routine with synced slots
          if (slotsChanged) {
            const routineIndex = syncedRoutines.findIndex(r => r.id === routine.id);
            if (routineIndex >= 0) {
              syncedRoutines[routineIndex] = {
                ...syncedRoutines[routineIndex],
                slots: syncedSlots
              };
              hasChanges = true;
            }
          }
        }
      }
      
      // Save synced routines back to IndexedDB and update state
      if (hasChanges) {
        await saveToIndexedDB(STORES.ROUTINES, syncedRoutines);
        setRoutines(syncedRoutines);
        // Update timestamp after successful sync
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log(`Offline routine changes synced with ${syncErrors} errors`);
      } else {
        console.log('No offline routine changes to sync');
      }
      
    } catch (err) {
      console.error('Error syncing offline routine changes:', err);
      setError('Failed to sync offline changes');
    } finally {
      setSyncInProgress(false);
    }
  };

  const createRoutine = async (routine: Omit<Routine, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, create a temporary ID and store locally
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const offlineRoutine: Routine = {
          ...routine,
          id: tempId,
          createdAt: new Date().toISOString(),
          slots: [],
          _isOffline: true // Mark as created offline for sync later
        };
        
        await saveToIndexedDB(STORES.ROUTINES, offlineRoutine);
        setRoutines(prev => [offlineRoutine, ...prev]);
        return offlineRoutine;
      } else {
        // Online mode - create on server
        const newRoutine = await createRoutineService(routine);
        setRoutines(prev => [newRoutine, ...prev]);
        
        // Update in IndexedDB
        await saveToIndexedDB(STORES.ROUTINES, newRoutine);
        
        return newRoutine;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update local copy
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToUpdate = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToUpdate) {
          const updatedRoutine = { ...routineToUpdate, ...updates, _isOfflineUpdated: true };
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
          
          setRoutines(prev =>
            prev.map(routine =>
              routine.id === id ? { ...routine, ...updates } : routine
            )
          );
        }
      } else {
        // Online mode - update on server
        await updateRoutineService(id, updates);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === id ? { ...routine, ...updates } : routine
          )
        );
        
        // Update in IndexedDB
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToUpdate = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToUpdate) {
          const updatedRoutine = { ...routineToUpdate, ...updates };
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, mark for deletion but don't remove from IndexedDB yet
        // Instead, we'll add a flag to delete it when back online
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToDelete = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToDelete) {
          const markedRoutine = { ...routineToDelete, _isOfflineDeleted: true };
          await saveToIndexedDB(STORES.ROUTINES, markedRoutine);
        }
        
        // Remove from state
        setRoutines(prev => prev.filter(routine => routine.id !== id));
      } else {
        // Online mode - delete from server
        await deleteRoutineService(id);
        
        // Remove from state
        setRoutines(prev => prev.filter(routine => routine.id !== id));
        
        // Properly clean up IndexedDB to prevent deleted routines from reappearing
        try {
          // Get all routines from IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          
          // Remove the deleted routine from the array
          const filteredRoutines = existingRoutines.filter((r: Routine) => r.id !== id);
          
          // Clear the store and save the filtered routines
          await clearIndexedDBStore(STORES.ROUTINES);
          
          // If there are remaining routines, save them back
          if (filteredRoutines.length > 0) {
            await saveToIndexedDB(STORES.ROUTINES, filteredRoutines);
          }
          
          // Force cache invalidation by updating the timestamp
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          
          console.log(`Routine ${id} successfully deleted from IndexedDB`);
        } catch (dbErr) {
          console.error('Error updating IndexedDB after deletion:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addRoutineSlot = async (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => {
    try {
      setError(null);
      console.log('Adding routine slot:', { routineId, slot }); // Debug log
      
      if (isOffline) {
        // In offline mode, create temporary slot
        const tempId = `temp-slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newSlot: RoutineSlot = {
          ...slot,
          id: tempId,
          routineId,
          createdAt: new Date().toISOString(),
          _isOffline: true // Mark as created offline
        };
        
        // Update routine in state and IndexedDB
        const updatedRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = updatedRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = updatedRoutines[routineIndex];
          const updatedRoutine = {
            ...routine,
            slots: [...(routine.slots || []), newSlot]
          };
          
          updatedRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
          
          setRoutines(prev =>
            prev.map(r =>
              r.id === routineId
                ? {
                    ...r,
                    slots: [...(r.slots || []), newSlot]
                  }
                : r
            )
          );
          
          return newSlot;
        } else {
          throw new Error('Routine not found');
        }
      } else {
        // Online mode - add slot on server
        const newSlot = await addRoutineSlotService(routineId, slot);
        console.log('New slot created:', newSlot); // Debug log
        
        // Update routine in state
        setRoutines(prev =>
          prev.map(r =>
            r.id === routineId
              ? {
                  ...r,
                  slots: [...(r.slots || []), newSlot]
                }
              : r
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineToUpdate = existingRoutines.find((r: Routine) => r.id === routineId);
          
          if (routineToUpdate) {
            const updatedRoutine = {
              ...routineToUpdate,
              slots: [...(routineToUpdate.slots || []), newSlot]
            };
            await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after adding slot:', dbErr);
        }
        
        return newSlot;
      }
    } catch (err: any) {
      console.error('Error adding routine slot:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateRoutineSlot = async (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update locally
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = existingRoutines[routineIndex];
          const updatedRoutine = {
            ...routine,
            slots: routine.slots?.map((slot: RoutineSlot) =>
              slot.id === slotId 
                ? { ...slot, ...updates, _isOfflineUpdated: true } 
                : slot
            )
          };
          
          existingRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          
          setRoutines(prev =>
            prev.map(r =>
              r.id === routineId
                ? {
                    ...r,
                    slots: r.slots?.map((slot: RoutineSlot) =>
                      slot.id === slotId ? { ...slot, ...updates } : slot
                    )
                  }
                : r
            )
          );
        }
      } else {
        // Online mode
        await updateRoutineSlotService(routineId, slotId, updates);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.map((slot: RoutineSlot) =>
                    slot.id === slotId ? { ...slot, ...updates } : slot
                  )
                }
              : routine
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
          
          if (routineIndex >= 0) {
            const routine = existingRoutines[routineIndex];
            const updatedRoutine = {
              ...routine,
              slots: routine.slots?.map((slot: RoutineSlot) =>
                slot.id === slotId ? { ...slot, ...updates } : slot
              )
            };
            
            existingRoutines[routineIndex] = updatedRoutine;
            await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after slot update:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoutineSlot = async (routineId: string, slotId: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Mark slot for deletion in offline mode
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = existingRoutines[routineIndex];
          
          // If it's a temp slot (created offline), remove it entirely 
          // Otherwise mark it for deletion with a flag
          const updatedSlots = routine.slots?.map((slot: RoutineSlot) => 
            slot.id === slotId ? { ...slot, _isOfflineDeleted: true } : slot
          ).filter((slot: RoutineSlot) => 
            !(slot.id === slotId && slot._isOffline) // Remove temporary slots immediately
          );
          
          const updatedRoutine = {
            ...routine,
            slots: updatedSlots
          };
          
          existingRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
        }
        
        // Update state
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.filter((slot: RoutineSlot) => slot.id !== slotId)
                }
              : routine
          )
        );
      } else {
        // Online mode
        await deleteRoutineSlotService(routineId, slotId);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.filter((slot: RoutineSlot) => slot.id !== slotId)
                }
              : routine
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
          
          if (routineIndex >= 0) {
            const routine = existingRoutines[routineIndex];
            const updatedRoutine = {
              ...routine,
              slots: routine.slots?.filter((slot: RoutineSlot) => slot.id !== slotId)
            };
            
            existingRoutines[routineIndex] = updatedRoutine;
            await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after slot deletion:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Bulk import multiple routine slots from JSON data
   */
  const bulkImportSlots = async (routineId: string, slotsData: any[]): Promise<{ success: number; errors: any[] }> => {
    if (isOffline) {
      return {
        success: 0,
        errors: [{ message: 'Bulk import is not available in offline mode' }]
      };
    }

    try {
      // Import slots in bulk
      const result = await bulkImportRoutineSlotsService(routineId, slotsData);
      
      // Refresh routines data to include new slots
      await loadRoutines(true);
      
      return result;
    } catch (error: any) {
      console.error('Error bulk importing slots:', error);
      return {
        success: 0,
        errors: [{ message: error.message || 'Failed to import slots' }]
      };
    }
  };

  // Export a routine with all its slots as a JSON file
  const exportRoutine = async (routineId: string) => {
    try {
      setLoading(true);
      const data = await exportRoutineWithSlotsService(routineId);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get all semesters for filtering
  const getSemesters = async () => {
    try {
      return await getAllSemestersService();
    } catch (err: any) {
      console.error('Error fetching semesters:', err);
      return [];
    }
  };
  
  // Get routines filtered by semester
  const getRoutinesBySemester = async (semester: string) => {
    try {
      setLoading(true);
      return await getRoutinesBySemesterService(semester);
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Refresh routines with fresh data from server
  const refreshRoutines = useCallback(async () => {
    if (!isOffline) {
      // For admin dashboard, always load fresh data without cache
      console.log('Admin dashboard: Refreshing routines with fresh data');
      
      // Load fresh data from server
      await loadRoutines(true);
    }
  }, [isOffline, loadRoutines]);

  return {
    routines,
    loading,
    error,
    syncInProgress,
    loadRoutines,
    syncOfflineChanges,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addRoutineSlot,
    updateRoutineSlot,
    deleteRoutineSlot,
    activateRoutine: async (routineId: string) => {
      try {
        setError(null);
        
        if (isOffline) {
          // When offline, just update state but mark for syncing later
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId,
              _needsActivationSync: routine.id === routineId ? true : undefined
            }))
          );
          
          // Update IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId,
            _needsActivationSync: routine.id === routineId ? true : undefined
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        } else {
          // Online mode, use the service
          await activateRoutineService(routineId);
          
          // Update state
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId
            }))
          );
          
          // Update in IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    deactivateRoutine: async (routineId: string) => {
      try {
        setError(null);
        
        if (isOffline) {
          // When offline, just update state but mark for syncing later
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId ? false : routine.isActive,
              _needsDeactivationSync: routine.id === routineId ? true : undefined
            }))
          );
          
          // Update IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId ? false : routine.isActive,
            _needsDeactivationSync: routine.id === routineId ? true : undefined
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        } else {
          // Online mode, use the service
          await deactivateRoutineService(routineId);
          
          // Update state
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId ? false : routine.isActive
            }))
          );
          
          // Update in IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId ? false : routine.isActive
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    bulkImportSlots,
    exportRoutine,
    getSemesters,
    getRoutinesBySemester,
    refreshRoutines,
    prefetchRoutineData
  };
}