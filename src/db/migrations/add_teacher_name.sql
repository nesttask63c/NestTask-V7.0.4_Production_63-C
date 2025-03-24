-- Add teacherName column to routine_slots table if it doesn't exist
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Update existing records to populate teacher_name from related teachers
UPDATE routine_slots 
SET teacher_name = teachers.name
FROM teachers
WHERE routine_slots.teacher_id = teachers.id 
  AND (routine_slots.teacher_name IS NULL OR routine_slots.teacher_name = '');

-- Add a comment to the column for documentation
COMMENT ON COLUMN routine_slots.teacher_name IS 'Direct teacher name for display purposes'; 