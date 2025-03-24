-- Script to fix teacher names in routine_slots table
-- This script ensures all routine slots have valid teacher names

-- First, make sure the teacher_name column exists
ALTER TABLE routine_slots ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Show current state (for debugging)
SELECT 'Before updates:' as status;
SELECT 
  COUNT(*) as total_slots,
  SUM(CASE WHEN teacher_id IS NOT NULL THEN 1 ELSE 0 END) as slots_with_teacher_id,
  SUM(CASE WHEN teacher_name IS NOT NULL AND teacher_name != '' THEN 1 ELSE 0 END) as slots_with_teacher_name
FROM routine_slots;

-- Update all teacher names from the related teachers table
UPDATE routine_slots 
SET teacher_name = teachers.name
FROM teachers
WHERE routine_slots.teacher_id = teachers.id;

-- For any slots with teacherId but no teacher_name, set a value
UPDATE routine_slots
SET teacher_name = 'Unknown Teacher'
WHERE teacher_id IS NOT NULL AND (teacher_name IS NULL OR teacher_name = '');

-- For any slots without teacherId, ensure teacher_name is 'N/A'
UPDATE routine_slots
SET teacher_name = 'N/A'
WHERE teacher_id IS NULL;

-- Show final state
SELECT 'After updates:' as status;
SELECT 
  COUNT(*) as total_slots,
  SUM(CASE WHEN teacher_id IS NOT NULL THEN 1 ELSE 0 END) as slots_with_teacher_id,
  SUM(CASE WHEN teacher_name IS NOT NULL AND teacher_name != '' THEN 1 ELSE 0 END) as slots_with_teacher_name
FROM routine_slots;

-- Show sample of updated data
SELECT 
  id, 
  teacher_id, 
  teacher_name,
  day_of_week,
  start_time,
  end_time 
FROM routine_slots 
ORDER BY created_at DESC 
LIMIT 10; 