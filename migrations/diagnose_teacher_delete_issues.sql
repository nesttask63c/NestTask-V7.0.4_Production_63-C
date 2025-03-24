-- Diagnose Teacher Delete Issues
-- Run this script to find potential problems with deleting teachers

-- Check if teachers table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'teachers'
) AS teachers_table_exists;

-- Count teachers
SELECT COUNT(*) AS teacher_count FROM teachers;

-- Find all foreign key constraints referencing teachers
SELECT
    tc.constraint_name,
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'teachers';

-- Check teacher_courses relationship
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'teacher_courses'
) AS teacher_courses_table_exists;

-- Count teacher_courses relationships
SELECT COUNT(*) AS teacher_course_count FROM teacher_courses;

-- Check for orphaned teacher_courses records (where teacher doesn't exist)
SELECT tc.teacher_id, COUNT(*) 
FROM teacher_courses tc
LEFT JOIN teachers t ON tc.teacher_id = t.id
WHERE t.id IS NULL
GROUP BY tc.teacher_id;

-- Check if any teachers have teachers.teacher_id column (redundant foreign key)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND column_name = 'teacher_id';

-- Check for other potential blocking relationships 
-- Check courses table for teacher_id foreign key
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'courses' 
  AND column_name = 'teacher_id'
) AS courses_has_teacher_id;

-- Check for any courses referring to teachers that might block deletion
SELECT COUNT(*) AS courses_with_teacher_id 
FROM courses 
WHERE teacher_id IS NOT NULL;

-- Check for any routines or routine_slots that might reference teachers
SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'routines' 
   AND column_name = 'teacher_id') > 0 AS routines_has_teacher_id,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'routine_slots' 
   AND column_name = 'teacher_id') > 0 AS routine_slots_has_teacher_id;

-- Check for triggers that might interfere with deletion
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teachers'
OR event_object_table = 'teacher_courses';

-- Script execution info for debugging
SELECT current_timestamp AS diagnostic_timestamp,
       current_user AS executed_by; 