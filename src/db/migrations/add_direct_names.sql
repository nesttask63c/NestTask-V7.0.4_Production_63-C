-- Add courseName and teacherName columns to routine_slots table if they don't exist
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Update all existing records to populate course_name from related courses
UPDATE routine_slots 
SET course_name = courses.name
FROM courses
WHERE routine_slots.course_id = courses.id;

-- Update all existing records to populate teacher_name from related teachers
UPDATE routine_slots 
SET teacher_name = teachers.name
FROM teachers
WHERE routine_slots.teacher_id = teachers.id;

-- For any remaining slots with course_id but no course_name, set a default value
UPDATE routine_slots
SET course_name = 'Unknown Course'
WHERE course_id IS NOT NULL AND (course_name IS NULL OR course_name = '');

-- For any remaining slots with teacher_id but no teacher_name, set a default value  
UPDATE routine_slots
SET teacher_name = 'Unknown Teacher'
WHERE teacher_id IS NOT NULL AND (teacher_name IS NULL OR teacher_name = '');

-- Add comments to the columns for documentation
COMMENT ON COLUMN routine_slots.course_name IS 'Direct course name for display purposes';
COMMENT ON COLUMN routine_slots.teacher_name IS 'Direct teacher name for display purposes';

-- Output summary of the change (this will appear in your Supabase SQL Editor results)
SELECT 
  COUNT(*) as total_slots,
  SUM(CASE WHEN course_name IS NOT NULL AND course_name != '' THEN 1 ELSE 0 END) as slots_with_course_name,
  SUM(CASE WHEN teacher_name IS NOT NULL AND teacher_name != '' THEN 1 ELSE 0 END) as slots_with_teacher_name
FROM routine_slots; 