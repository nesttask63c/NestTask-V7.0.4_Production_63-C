/*
  # Add teacher_id to routine_slots table

  1. Changes
    - Add teacher_id column to routine_slots table
    - Add foreign key constraint to teachers table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add teacher_id column to routine_slots table
ALTER TABLE routine_slots
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;

-- Create index for teacher_id
CREATE INDEX IF NOT EXISTS idx_routine_slots_teacher ON routine_slots(teacher_id);