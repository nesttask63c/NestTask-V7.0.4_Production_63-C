import { supabase } from '../lib/supabase';
import type { Routine, RoutineSlot } from '../types/routine';

export async function fetchRoutines(): Promise<Routine[]> {
  try {
    console.log('Using optimized approach for fetching routines');
    
    // Make a single query to fetch routines with slots and prefetch all related data
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(`
        *,
        slots:routine_slots (
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          section,
          course_id,
          teacher_id,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (routinesError) throw routinesError;

    // Fetch required data in parallel
    const [coursesResponse, teachersResponse] = await Promise.all([
      supabase.from('courses').select('id,name,code'),
      supabase.from('teachers').select('id,name')
    ]);
    
    const allCourses = coursesResponse.data || [];
    const allTeachers = teachersResponse.data || [];

    // Create lookup maps for faster access
    const courseMap = new Map();
    const teacherMap = new Map();
    
    allCourses.forEach(course => courseMap.set(course.id, { name: course.name, code: course.code }));
    allTeachers.forEach(teacher => teacherMap.set(teacher.id, teacher.name));

    return routines.map(routine => ({
      id: routine.id,
      name: routine.name,
      description: routine.description,
      semester: routine.semester,
      isActive: routine.is_active,
      createdAt: routine.created_at,
      createdBy: routine.created_by,
      slots: routine.slots?.map((slot: any) => {
        // Get course and teacher info from maps (constant time lookup)
        const courseInfo = courseMap.get(slot.course_id) || {};
        const teacherName = teacherMap.get(slot.teacher_id) || '';
        
        return {
          id: slot.id,
          routineId: routine.id,
          courseId: slot.course_id,
          teacherId: slot.teacher_id,
          courseName: courseInfo.name || '',
          courseCode: courseInfo.code || '',
          teacherName: teacherName,
          dayOfWeek: slot.day_of_week,
          startTime: slot.start_time,
          endTime: slot.end_time,
          roomNumber: slot.room_number,
          section: slot.section,
          createdAt: slot.created_at
        };
      })
    }));
  } catch (error) {
    console.error('Error fetching routines:', error);
    throw error;
  }
}

export async function createRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'createdBy'>): Promise<Routine> {
  try {
    // Create database insert object with correct field mappings
    const dbRoutine = {
      name: routine.name,
      description: routine.description,
      semester: routine.semester,
      is_active: routine.isActive
    };
    
    const { data, error } = await supabase
      .from('routines')
      .insert(dbRoutine)
      .select()
      .single();

    if (error) throw error;
    
    // Map database fields back to JavaScript camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      semester: data.semester,
      isActive: data.is_active,
      createdAt: data.created_at,
      createdBy: data.created_by,
      slots: []
    };
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
}

export async function updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
  try {
    // Create database update object with correct field mappings
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.semester !== undefined) dbUpdates.semester = updates.semester;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    
    const { error } = await supabase
      .from('routines')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
}

export async function deleteRoutine(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
}

export async function addRoutineSlot(
  routineId: string,
  slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>
): Promise<RoutineSlot> {
  try {
    console.log('Service: Adding routine slot', { routineId, slot });

    if (!routineId) {
      console.error('Missing routineId');
      throw new Error('Missing routine ID');
    }
    
    if (!slot) {
      console.error('Missing slot data');
      throw new Error('Missing slot data');
    }
    
    if (!slot.dayOfWeek) {
      console.error('Missing dayOfWeek');
      throw new Error('Day of week is required');
    }
    
    if (!slot.startTime) {
      console.error('Missing startTime');
      throw new Error('Start time is required');
    }
    
    if (!slot.endTime) {
      console.error('Missing endTime');
      throw new Error('End time is required');
    }

    // Get course name if not provided but courseId is
    let courseName = slot.courseName || '';
    if (slot.courseId && !courseName) {
      const { data: course } = await supabase
        .from('courses')
        .select('name')
        .eq('id', slot.courseId)
        .single();
      
      if (course) {
        courseName = course.name;
      }
    }

    // Get teacher name if not provided but teacherId is
    let teacherName = slot.teacherName || '';
    if (slot.teacherId && !teacherName) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('name')
        .eq('id', slot.teacherId)
        .single();
      
      if (teacher) {
        teacherName = teacher.name;
      }
    }

    try {
      // First, try to insert with course_name and teacher_name
      const { data, error } = await supabase
        .from('routine_slots')
        .insert({
          routine_id: routineId,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          room_number: slot.roomNumber || null,
          section: slot.section || null,
          course_id: slot.courseId || null,
          teacher_id: slot.teacherId || null,
          course_name: courseName || null,
          teacher_name: teacherName || null
        })
        .select('*')
        .single();

      if (error) {
        // If we get an error about missing columns, try without those columns
        if (error.message.includes('column "course_name" of relation "routine_slots" does not exist') ||
            error.message.includes('column "teacher_name" of relation "routine_slots" does not exist')) {
          
          // Fallback: insert without the missing columns
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('routine_slots')
            .insert({
              routine_id: routineId,
              day_of_week: slot.dayOfWeek,
              start_time: slot.startTime,
              end_time: slot.endTime,
              room_number: slot.roomNumber || null,
              section: slot.section || null,
              course_id: slot.courseId || null,
              teacher_id: slot.teacherId || null
            })
            .select('*')
            .single();
            
          if (fallbackError) {
            console.error('Database error (fallback):', fallbackError);
            throw new Error(`Failed to add routine slot: ${fallbackError.message}`);
          }
          
          if (!fallbackData) {
            console.error('No data returned from database (fallback)');
            throw new Error('No data returned from database');
          }
          
          // Return the slot with the course/teacher names we have
          return {
            id: fallbackData.id,
            routineId: fallbackData.routine_id,
            courseId: fallbackData.course_id,
            teacherId: fallbackData.teacher_id,
            courseName: courseName || '',
            teacherName: teacherName || '',
            dayOfWeek: fallbackData.day_of_week,
            startTime: fallbackData.start_time,
            endTime: fallbackData.end_time,
            roomNumber: fallbackData.room_number,
            section: fallbackData.section,
            createdAt: fallbackData.created_at
          };
        } else {
          // Some other error occurred
          console.error('Database error:', error);
          throw new Error(`Failed to add routine slot: ${error.message}`);
        }
      }

      if (!data) {
        console.error('No data returned from database');
        throw new Error('No data returned from database');
      }

      const result = {
        id: data.id,
        routineId: data.routine_id,
        courseId: data.course_id,
        teacherId: data.teacher_id,
        courseName: data.course_name || courseName || '',
        teacherName: data.teacher_name || teacherName || '',
        dayOfWeek: data.day_of_week,
        startTime: data.start_time,
        endTime: data.end_time,
        roomNumber: data.room_number,
        section: data.section,
        createdAt: data.created_at
      };
      
      console.log('Service: Successfully added routine slot', result);
      
      return result;
    } catch (error: any) {
      console.error('Error adding routine slot:', error);
      throw new Error(error.message || 'Failed to add routine slot');
    }
  } catch (error: any) {
    console.error('Error adding routine slot:', error);
    throw new Error(error.message || 'Failed to add routine slot');
  }
}

export async function updateRoutineSlot(
  routineId: string,
  slotId: string,
  updates: Partial<RoutineSlot>
): Promise<void> {
  try {
    console.log('Updating routine slot:', { routineId, slotId, updates });
    
    // Get course name if not provided but courseId is updated
    let courseName = updates.courseName;
    if (updates.courseId && !courseName) {
      const { data: course } = await supabase
        .from('courses')
        .select('name')
        .eq('id', updates.courseId)
        .single();
      
      if (course) {
        courseName = course.name;
      }
    }

    // Get teacher name if not provided but teacherId is updated
    let teacherName = updates.teacherName;
    if (updates.teacherId && !teacherName) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('name')
        .eq('id', updates.teacherId)
        .single();
      
      if (teacher) {
        teacherName = teacher.name;
      }
    }
    
    try {
      // First try updating with course_name and teacher_name fields
      const updateFields: any = {
        course_id: updates.courseId,
        teacher_id: updates.teacherId,
        day_of_week: updates.dayOfWeek,
        start_time: updates.startTime,
        end_time: updates.endTime,
        room_number: updates.roomNumber,
        section: updates.section,
        course_name: courseName,
        teacher_name: teacherName
      };
      
      const { error } = await supabase
        .from('routine_slots')
        .update(updateFields)
        .eq('id', slotId)
        .eq('routine_id', routineId);

      if (error) {
        // If we get an error about missing columns, try without those columns
        if (error.message.includes('column "course_name" of relation "routine_slots" does not exist') ||
            error.message.includes('column "teacher_name" of relation "routine_slots" does not exist')) {
          
          // Remove the problematic fields
          delete updateFields.course_name;
          delete updateFields.teacher_name;
          
          const { error: fallbackError } = await supabase
            .from('routine_slots')
            .update(updateFields)
            .eq('id', slotId)
            .eq('routine_id', routineId);
            
          if (fallbackError) {
            console.error('Database error (fallback):', fallbackError);
            throw fallbackError;
          }
        } else {
          // Some other error
          console.error('Database error:', error);
          throw error;
        }
      }

      console.log('Successfully updated routine slot');
    } catch (error) {
      console.error('Error updating routine slot:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating routine slot:', error);
    throw error;
  }
}

export async function deleteRoutineSlot(routineId: string, slotId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routine_slots')
      .delete()
      .eq('id', slotId)
      .eq('routine_id', routineId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting routine slot:', error);
    throw error;
  }
}

/**
 * Activates a specific routine and deactivates all others
 * @param routineId The ID of the routine to activate
 * @returns Promise that resolves when the routine is activated
 */
export async function activateRoutine(routineId: string): Promise<void> {
  try {
    // First, deactivate all routines
    const { error: deactivateError } = await supabase
      .from('routines')
      .update({ is_active: false })
      .neq('id', routineId);
    
    if (deactivateError) throw deactivateError;
    
    // Then, activate the selected routine
    const { error: activateError } = await supabase
      .from('routines')
      .update({ is_active: true })
      .eq('id', routineId);
    
    if (activateError) throw activateError;
    
  } catch (error) {
    console.error('Error activating routine:', error);
    throw error;
  }
}

/**
 * Deactivates a specific routine without activating others
 * @param routineId The ID of the routine to deactivate
 * @returns Promise that resolves when the routine is deactivated
 */
export async function deactivateRoutine(routineId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('id', routineId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deactivating routine:', error);
    throw error;
  }
}

/**
 * Converts 12-hour format time (e.g. "09:30 AM") to 24-hour format (e.g. "09:30:00")
 */
function convertTo24HourFormat(timeString: string): string {
  try {
    const [timePart, amPmPart] = timeString.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (amPmPart.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (amPmPart.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error converting time format:', error);
    return timeString; // Return original if parsing fails
  }
}

/**
 * Bulk import time slots from JSON data
 * @param routineId The ID of the routine to import slots for
 * @param slotsData The array of slot data from the JSON file
 * @returns An object with success count and errors array
 */
export async function bulkImportRoutineSlots(
  routineId: string, 
  slotsData: Array<{
    day: string;
    start_time: string;
    end_time: string;
    course?: string;
    course_title?: string;
    course_code?: string;
    teacher: string;
    room_number?: string;
    section?: string;
    _teacherId?: string; // Optional: directly provided teacher ID
    _courseId?: string;  // Optional: directly provided course ID
  }>
): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let successCount = 0;
  
  // Validate routine existence
  try {
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id')
      .eq('id', routineId)
      .single();
      
    if (routineError || !routine) {
      throw new Error('Routine not found');
    }
  } catch (error: any) {
    return { 
      success: 0, 
      errors: [{ message: `Invalid routine ID: ${error.message}` }] 
    };
  }
  
  // First pass: Extract course/teacher info and fetch their IDs
  const courseCache = new Map<string, string | null>();
  const teacherCache = new Map<string, string | null>();
  
  // Helper function to extract course code
  const extractCourseCode = (courseName: string): string => {
    const parts = courseName.split('-');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim();
    }
    return courseName.trim();
  };
  
  // Prepare slot data with all necessary validation
  const processedSlots = [];
  
  for (const [index, slot] of slotsData.entries()) {
    try {
      // Use provided IDs if available, otherwise look them up
      let courseId: string | null = slot._courseId || null;
      let teacherId: string | null = slot._teacherId || null;
      
      // Track course and teacher names
      let courseName: string | null = null;
      let teacherName: string | null = null;
      
      // If no explicit course ID provided, try to find it
      if (!courseId) {
        // Handle both new and old formats
        let courseCode = '';
        if (slot.course_code) {
          // New format with explicit code
          courseCode = slot.course_code.trim();
          courseName = slot.course_title || null;
        } else if (slot.course) {
          // Old format "Name - CODE"
          courseCode = extractCourseCode(slot.course);
          courseName = slot.course.split('-')[0].trim() || null;
        }
        
        // Check course cache first or fetch from database if code available
        if (courseCode && courseCode.length > 0) {
          if (courseCache.has(courseCode)) {
            courseId = courseCache.get(courseCode) || null;
          } else {
            const { data: course, error: courseError } = await supabase
              .from('courses')
              .select('id, name')
              .ilike('code', courseCode)
              .limit(1)
              .single();
            
            if (courseError) {
              console.warn(`Course not found: ${courseCode}`, courseError);
            }
            
            if (course) {
              courseId = course.id || null;
              courseName = course.name || courseName;
            }
            courseCache.set(courseCode, courseId);
          }
        }
      } else {
        // If course ID is provided directly, get the course name
        const { data: course } = await supabase
          .from('courses')
          .select('name')
          .eq('id', courseId)
          .single();
        
        if (course) {
          courseName = course.name;
        }
      }
      
      // If no explicit teacher ID provided, try to find it
      if (!teacherId) {
        const teacherNameToSearch = slot.teacher.trim();
        teacherName = teacherNameToSearch;
        
        // Check teacher cache first or fetch from database
        if (teacherCache.has(teacherNameToSearch)) {
          teacherId = teacherCache.get(teacherNameToSearch) || null;
        } else {
          const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .ilike('name', teacherNameToSearch)
            .limit(1)
            .single();
          
          if (teacherError) {
            console.warn(`Teacher not found: ${teacherNameToSearch}`, teacherError);
          }
          
          teacherId = teacher?.id || null;
          teacherCache.set(teacherNameToSearch, teacherId);
        }
      } else {
        // If teacher ID is provided directly, get the teacher name
        const { data: teacher } = await supabase
          .from('teachers')
          .select('name')
          .eq('id', teacherId)
          .single();
        
        if (teacher) {
          teacherName = teacher.name;
        } else {
          teacherName = slot.teacher;
        }
      }
      
      // Validate times and convert to 24-hour format
      const startTime = convertTo24HourFormat(slot.start_time);
      const endTime = convertTo24HourFormat(slot.end_time);
      
      // Check for scheduling conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from('routine_slots')
        .select('id')
        .eq('routine_id', routineId)
        .eq('day_of_week', slot.day)
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)
        .limit(1);
      
      if (conflictError) {
        console.error('Error checking for conflicts:', conflictError);
      }
      
      if (conflicts && conflicts.length > 0) {
        errors.push({
          message: `Slot #${index + 1}: Time conflict with existing slot on ${slot.day} at ${slot.start_time} - ${slot.end_time}`
        });
        continue;
      }
      
      // Prepare the slot data - always include course_name and teacher_name for future compatibility
      processedSlots.push({
        routine_id: routineId,
        course_id: courseId,
        teacher_id: teacherId,
        course_name: courseName,
        teacher_name: teacherName,
        day_of_week: slot.day,
        start_time: startTime,
        end_time: endTime,
        room_number: slot.room_number || null,
        section: slot.section || null
      });
      
    } catch (error: any) {
      errors.push({
        message: `Error processing slot #${index + 1}: ${error.message}`
      });
    }
  }
  
  // Insert all processed slots in a batch
  if (processedSlots.length > 0) {
    try {
      // First try inserting with course_name and teacher_name fields
      try {
        const { data, error } = await supabase
          .from('routine_slots')
          .insert(processedSlots)
          .select();
        
        if (error) {
          // If we get an error about missing columns, try without those columns
          if (error.message.includes('column "course_name" of relation "routine_slots" does not exist') ||
              error.message.includes('column "teacher_name" of relation "routine_slots" does not exist')) {
            throw new Error('Missing columns, using fallback');
          }
          throw error;
        }
        
        successCount = data ? data.length : 0;
      } catch (columnError: any) {
        // Fallback: Try without course_name and teacher_name fields
        console.log('Using fallback for bulk import:', columnError.message);
        
        // Create a new array of slots without the potentially missing columns
        const fallbackSlots = processedSlots.map(slot => {
          const { course_name, teacher_name, ...rest } = slot;
          return rest;
        });
        
        const { data, error } = await supabase
          .from('routine_slots')
          .insert(fallbackSlots)
          .select();
        
        if (error) {
          throw error;
        }
        
        successCount = data ? data.length : 0;
      }
    } catch (error: any) {
      errors.push({
        message: `Database error during import: ${error.message}`
      });
    }
  }
  
  return {
    success: successCount,
    errors
  };
}

/**
 * Export a routine to JSON format including all its slots
 */
export async function exportRoutineWithSlots(routineId: string): Promise<{ routine: any, slots: any[] }> {
  try {
    // Get routine details
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .single();
    
    if (routineError) throw routineError;
    if (!routine) throw new Error('Routine not found');
    
    // Get all slots for this routine
    const { data: slots, error: slotsError } = await supabase
      .from('routine_slots')
      .select('*')
      .eq('routine_id', routineId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (slotsError) throw slotsError;
    
    // Return formatted result with both routine and slots
    return {
      routine,
      slots: slots || []
    };
  } catch (error) {
    console.error('Error exporting routine:', error);
    throw error;
  }
}

/**
 * Get a list of all semesters from existing routines
 */
export async function getAllSemesters(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('semester')
      .order('semester', { ascending: true });
    
    if (error) throw error;
    
    // Extract unique semesters
    const semesters = [...new Set(data?.map(r => r.semester) || [])];
    return semesters;
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
}

/**
 * Filters routines by a specific semester
 */
export async function getRoutinesBySemester(semester: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('semester', semester)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching routines by semester:', error);
    return [];
  }
}