-- Fix foreign key constraint issues for teacher deletion
-- This script helps resolve issues where teachers can't be deleted because they are referenced in courses table

-- IMPORTANT: Make a database backup before running this script

-- 1. Get list of teachers that are referenced in courses
SELECT 
  t.id AS teacher_id, 
  t.name AS teacher_name, 
  COUNT(c.id) AS referenced_count,
  string_agg(c.name || ' (' || c.code || ')', ', ') AS courses
FROM teachers t
INNER JOIN courses c ON c.teacher_id = t.id
GROUP BY t.id, t.name;

-- 2. Fix method 1: Set teacher_id to NULL in courses table for specific teacher (safer approach)
-- Replace 'TEACHER_ID_HERE' with the actual teacher ID you want to delete

-- UNCOMMENT AND MODIFY BELOW TO USE:
/*
UPDATE courses 
SET teacher_id = NULL 
WHERE teacher_id = 'TEACHER_ID_HERE';

-- Verify the update worked
SELECT COUNT(*) FROM courses WHERE teacher_id = 'TEACHER_ID_HERE';
*/

-- 3. Fix method 2: Set ALL teacher_id references to NULL (use with caution!)
-- This will remove all teacher references in the courses table

-- UNCOMMENT TO USE: 
/*
UPDATE courses SET teacher_id = NULL WHERE teacher_id IS NOT NULL;
*/

-- 4. Add the teacher association properly through teacher_courses table
-- This sets up the proper way to associate teachers with courses instead of using direct foreign keys

-- UNCOMMENT AND MODIFY BELOW TO USE:
/*
INSERT INTO teacher_courses (teacher_id, course_id)
SELECT 'TEACHER_ID_HERE', id 
FROM courses 
WHERE teacher_id = 'TEACHER_ID_HERE';
*/

-- 5. Check if these fixes resolved the issue
SELECT 
  (SELECT COUNT(*) FROM courses WHERE teacher_id IS NOT NULL) AS remaining_course_references,
  (SELECT COUNT(*) FROM teacher_courses) AS teacher_course_associations;

-- Instructions:
-- 1. First run the script without uncommenting anything to analyze the current state
-- 2. Uncomment the appropriate fix section and replace 'TEACHER_ID_HERE' with the actual teacher ID
-- 3. After running the fixes, try deleting the teacher again through the application
-- 4. If needed, additional database schema changes may be required to fully resolve the issue 