-- Add courseName column to routine_slots table if it doesn't exist
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Update existing records to populate course_name from related courses
UPDATE routine_slots 
SET course_name = courses.name
FROM courses
WHERE routine_slots.course_id = courses.id 
  AND (routine_slots.course_name IS NULL OR routine_slots.course_name = '');

-- Add a comment to the column for documentation
COMMENT ON COLUMN routine_slots.course_name IS 'Direct course name for display purposes'; 