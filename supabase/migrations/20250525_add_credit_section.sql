/*
  # Add credit and section fields to courses table

  1. Changes
    - Add credit column to courses table (INTEGER)
    - Add section column to courses table (TEXT)
    
  2. Notes
    - Safe migration that only adds new nullable columns
    - No data migration needed
*/

-- Add credit and section columns to courses table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'credit'
  ) THEN
    ALTER TABLE courses ADD COLUMN credit INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'section'
  ) THEN
    ALTER TABLE courses ADD COLUMN section TEXT;
  END IF;
END $$; 