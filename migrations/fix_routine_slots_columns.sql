-- Add courseName and teacherName columns to routine_slots table
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Comment explaining the purpose
COMMENT ON COLUMN routine_slots.course_name IS 'Direct course name for display purposes';
COMMENT ON COLUMN routine_slots.teacher_name IS 'Direct teacher name for display purposes';

-- Populate the columns with data from existing relationships
UPDATE routine_slots
SET course_name = courses.name
FROM courses
WHERE routine_slots.course_id = courses.id
AND routine_slots.course_name IS NULL;

UPDATE routine_slots
SET teacher_name = teachers.name
FROM teachers
WHERE routine_slots.teacher_id = teachers.id
AND routine_slots.teacher_name IS NULL; 