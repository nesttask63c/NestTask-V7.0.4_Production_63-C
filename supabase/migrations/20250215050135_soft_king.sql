/*
  # Add course relationship to study materials

  1. Changes
    - Create study_materials table if it doesn't exist
    - Add course_id column with foreign key constraint
    - Add index for better query performance
    - Add RLS policies for proper access control

  2. Security
    - Enable RLS on study_materials table
    - Add policy for authenticated users
*/

-- Create study_materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  file_urls text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Add index on course_id for better query performance
CREATE INDEX IF NOT EXISTS idx_study_materials_course_id 
ON study_materials(course_id);

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users"
  ON study_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users"
  ON study_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );