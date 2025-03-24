import { supabase } from '../lib/supabase';
import type { Course, NewCourse, StudyMaterial, NewStudyMaterial } from '../types/course';
import { checkTeacherNameExists } from './teacher.service';
import { NewTeacher } from '../types/teacher';

// Course functions
export async function fetchCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        study_materials (
          id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(course => ({
      ...mapCourseFromDB(course),
      materialCount: course.study_materials?.length || 0
    })) : [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function createCourse(course: NewCourse): Promise<Course> {
  try {
    // Format class times into a string
    const formattedClassTimes = course.classTimes
      .map(ct => `${ct.day} at ${ct.time}${ct.classroom ? ` in ${ct.classroom}` : ''}`)
      .join(', ');

    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        code: course.code,
        teacher: course.teacher,
        class_time: formattedClassTimes,
        telegram_group: course.telegramGroup,
        blc_link: course.blcLink,
        blc_enroll_key: course.blcEnrollKey,
        credit: course.credit,
        section: course.section
      })
      .select()
      .single();

    if (error) throw error;
    return mapCourseFromDB(data);
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  try {
    // Format class times if they're being updated
    const formattedClassTimes = updates.classTimes
      ? updates.classTimes.map(ct => 
          `${ct.day} at ${ct.time}${ct.classroom ? ` in ${ct.classroom}` : ''}`
        ).join(', ')
      : undefined;

    const { data, error } = await supabase
      .from('courses')
      .update({
        name: updates.name,
        code: updates.code,
        teacher: updates.teacher,
        class_time: formattedClassTimes,
        telegram_group: updates.telegramGroup,
        blc_link: updates.blcLink,
        blc_enroll_key: updates.blcEnrollKey,
        credit: updates.credit,
        section: updates.section
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCourseFromDB(data);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    console.log(`Attempting to delete course with ID: ${id}`);
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error during course deletion:', error);
      throw error;
    }
    
    console.log(`Successfully deleted course: ${id}`);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

// Study Materials functions
export async function fetchStudyMaterials(): Promise<StudyMaterial[]> {
  try {
    const { data: materials, error: materialsError } = await supabase
      .from('study_materials')
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .order('created_at', { ascending: false });

    if (materialsError) throw materialsError;

    return materials.map(material => ({
      id: material.id,
      title: material.title,
      description: material.description,
      courseid: material.course_id,
      category: material.category,
      fileUrls: material.file_urls || [],
      originalFileNames: material.original_file_names || [],
      createdAt: material.created_at,
      createdBy: material.created_by,
      course: material.course ? mapCourseFromDB(material.course) : undefined
    }));
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw error;
  }
}

export async function createStudyMaterial(material: NewStudyMaterial): Promise<StudyMaterial> {
  try {
    console.log('Creating study material with data:', material); // Debug log

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        title: material.title,
        description: material.description,
        course_id: material.courseId, // Changed from courseid to courseId
        category: material.category,
        file_urls: material.fileUrls,
        original_file_names: material.originalFileNames
      })
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create study material: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database after creating study material');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      courseid: data.course_id,
      category: data.category,
      fileUrls: data.file_urls || [],
      originalFileNames: data.original_file_names || [],
      createdAt: data.created_at,
      createdBy: data.created_by,
      course: data.course ? mapCourseFromDB(data.course) : undefined
    };
  } catch (error) {
    console.error('Error creating study material:', error);
    throw error;
  }
}

export async function updateStudyMaterial(id: string, updates: Partial<StudyMaterial>): Promise<StudyMaterial> {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .update({
        title: updates.title,
        description: updates.description,
        course_id: updates.courseid,
        category: updates.category,
        file_urls: updates.fileUrls,
        original_file_names: updates.originalFileNames
      })
      .eq('id', id)
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      courseid: data.course_id,
      category: data.category,
      fileUrls: data.file_urls || [],
      originalFileNames: data.original_file_names || [],
      createdAt: data.created_at,
      createdBy: data.created_by,
      course: data.course ? mapCourseFromDB(data.course) : undefined
    };
  } catch (error) {
    console.error('Error updating study material:', error);
    throw error;
  }
}

export async function deleteStudyMaterial(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
}

// Helper function to map database fields to camelCase
function mapCourseFromDB(data: any): Course {
  // Parse class times from the string format back to array
  const classTimes = data.class_time.split(', ').map((timeStr: string) => {
    // Check if the time string includes classroom information
    const hasClassroom = timeStr.includes(' in ');
    if (hasClassroom) {
      const [timeInfo, classroom] = timeStr.split(' in ');
      const [day, time] = timeInfo.split(' at ');
      return { day, time, classroom };
    } else {
      const [day, time] = timeStr.split(' at ');
      return { day, time };
    }
  });

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    teacher: data.teacher,
    classTimes,
    telegramGroup: data.telegram_group,
    blcLink: data.blc_link,
    blcEnrollKey: data.blc_enroll_key,
    credit: data.credit,
    section: data.section,
    createdAt: data.created_at,
    createdBy: data.created_by
  };
}

/**
 * Bulk import courses from JSON data
 * @param courses The array of courses to import
 * @returns An object with success count and errors array
 */
export async function bulkImportCourses(courses: NewCourse[]): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let successCount = 0;
  
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    try {
      // Format class times into a string (which should be empty as we're not importing class times)
      const formattedClassTimes = course.classTimes
        .map(ct => `${ct.day} at ${ct.time}${ct.classroom ? ` in ${ct.classroom}` : ''}`)
        .join(', ');
      
      // Check if a course with this code already exists
      const { data: existingCourse, error: checkError } = await supabase
        .from('courses')
        .select('id, code')
        .eq('code', course.code)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(`Error checking for existing course: ${checkError.message}`);
      }
      
      if (existingCourse) {
        errors.push({
          message: `Course #${i + 1} (${course.code}): A course with this code already exists`
        });
        continue;
      }
      
      // Check if the teacher exists - if not, create a new teacher
      let teacherId: string | undefined = course.teacherId;
      
      if (!teacherId && course.teacher) {
        // If no teacher ID was provided but a teacher name was, check if the teacher exists
        const teacherExists = await checkTeacherNameExists(course.teacher);
        
        if (!teacherExists) {
          // Teacher doesn't exist, create a new teacher record
          console.log(`Creating new teacher "${course.teacher}" for course #${i + 1} (${course.code})`);
          
          try {
            // Create the teacher with minimal information
            const { data: newTeacher, error: teacherError } = await supabase
              .from('teachers')
              .insert({
                name: course.teacher,
                phone: 'N/A', // Required field, using placeholder
                department: course.teacher.includes('(') ? course.teacher.split('(')[1].replace(')', '') : undefined
              })
              .select()
              .single();
              
            if (teacherError) {
              // If there's an error creating the teacher, log it but continue with course creation
              console.error(`Error creating teacher: ${teacherError.message}`);
              errors.push({
                message: `Course #${i + 1} (${course.code}): Warning - Could not create teacher "${course.teacher}": ${teacherError.message}`,
                isWarning: true
              });
            } else {
              // Use the new teacher's ID
              teacherId = newTeacher.id;
              console.log(`Created new teacher with ID ${teacherId}`);
              errors.push({
                message: `Created teacher "${course.teacher}" for course "${course.code}"`,
                isWarning: true,
                isSuccess: true
              });
            }
          } catch (teacherCreateError: any) {
            console.error(`Error creating teacher:`, teacherCreateError);
            errors.push({
              message: `Course #${i + 1} (${course.code}): Warning - Failed to create teacher: ${teacherCreateError.message}`,
              isWarning: true
            });
          }
        } else {
          // Teacher exists, we need to get their ID
          try {
            const { data: existingTeacher, error: teacherFetchError } = await supabase
              .from('teachers')
              .select('id')
              .ilike('name', course.teacher)
              .maybeSingle();
              
            if (teacherFetchError) {
              console.error(`Error fetching existing teacher: ${teacherFetchError.message}`);
            } else if (existingTeacher) {
              teacherId = existingTeacher.id;
              console.log(`Found existing teacher with ID ${teacherId}`);
            }
          } catch (teacherFetchError: any) {
            console.error(`Error fetching teacher:`, teacherFetchError);
          }
        }
      }
      
      // Insert the new course
      const { data, error } = await supabase
        .from('courses')
        .insert({
          name: course.name,
          code: course.code,
          teacher: course.teacher,
          class_time: formattedClassTimes,
          telegram_group: course.telegramGroup,
          blc_link: course.blcLink,
          blc_enroll_key: course.blcEnrollKey,
          credit: course.credit,
          section: course.section,
          teacher_id: teacherId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If teacher ID exists, create the association in teacher_courses
      if (teacherId) {
        try {
          const { error: associationError } = await supabase
            .from('teacher_courses')
            .insert({
              teacher_id: teacherId,
              course_id: data.id
            });
            
          if (associationError) {
            console.error(`Error creating teacher-course association: ${associationError.message}`);
            errors.push({
              message: `Course #${i + 1} (${course.code}): Warning - Could not associate teacher with course: ${associationError.message}`,
              isWarning: true
            });
          }
        } catch (associationError: any) {
          console.error(`Error creating association:`, associationError);
        }
      }
      
      successCount++;
    } catch (error: any) {
      console.error(`Error importing course #${i + 1}:`, error);
      errors.push({
        message: `Course #${i + 1} (${course.code}): ${error.message || 'Unknown error'}`
      });
    }
  }
  
  return {
    success: successCount,
    errors
  };
}