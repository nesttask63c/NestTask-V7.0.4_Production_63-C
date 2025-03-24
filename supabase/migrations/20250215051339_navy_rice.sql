/*
  # Add original_file_names column to study_materials table

  1. Changes
    - Add original_file_names column to store original filenames
    - Update existing policies to include new column
*/

-- Add original_file_names column if it doesn't exist
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS original_file_names text[] DEFAULT ARRAY[]::text[];

-- Ensure RLS policies are up to date
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they include the new column
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON study_materials;
DROP POLICY IF EXISTS "Enable insert for admin users" ON study_materials;
DROP POLICY IF EXISTS "Enable update for admin users" ON study_materials;
DROP POLICY IF EXISTS "Enable delete for admin users" ON study_materials;

CREATE POLICY "Enable read access for all authenticated users"
  ON study_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users"
  ON study_materials FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users"
  ON study_materials FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users"
  ON study_materials FOR DELETE
  TO authenticated
  USING (is_admin());