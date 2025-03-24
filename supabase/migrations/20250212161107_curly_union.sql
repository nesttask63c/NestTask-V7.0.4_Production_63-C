/*
  # Add BLC fields to courses table

  1. Changes
    - Add blc_link column to courses table
    - Add blc_enroll_key column to courses table
    
  2. Notes
    - Safe migration that only adds new nullable columns
    - No data migration needed
*/

-- Add BLC-related columns to courses table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'blc_link'
  ) THEN
    ALTER TABLE courses ADD COLUMN blc_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'blc_enroll_key'
  ) THEN
    ALTER TABLE courses ADD COLUMN blc_enroll_key text;
  END IF;
END $$;