-- Create courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  teacher text NOT NULL,
  class_time text NOT NULL,
  telegram_group text,
  blc_link text,
  blc_enroll_key text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create study materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  category text NOT NULL,
  file_urls text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all authenticated users on courses" ON courses;
  DROP POLICY IF EXISTS "Enable insert for admin users on courses" ON courses;
  DROP POLICY IF EXISTS "Enable update for admin users on courses" ON courses;
  DROP POLICY IF EXISTS "Enable delete for admin users on courses" ON courses;
  DROP POLICY IF EXISTS "Enable read access for all authenticated users on study_materials" ON study_materials;
  DROP POLICY IF EXISTS "Enable insert for admin users on study_materials" ON study_materials;
  DROP POLICY IF EXISTS "Enable update for admin users on study_materials" ON study_materials;
  DROP POLICY IF EXISTS "Enable delete for admin users on study_materials" ON study_materials;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create fresh policies for courses
CREATE POLICY "Enable read access for all authenticated users on courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on courses"
  ON courses FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create fresh policies for study materials
CREATE POLICY "Enable read access for all authenticated users on study_materials"
  ON study_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on study_materials"
  ON study_materials FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on study_materials"
  ON study_materials FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on study_materials"
  ON study_materials FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_study_materials_course ON study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON study_materials(category);

-- Update foreign key for course relationship
ALTER TABLE study_materials
  DROP CONSTRAINT IF EXISTS study_materials_course_id_fkey,
  ADD CONSTRAINT study_materials_course_id_fkey 
    FOREIGN KEY (course_id) 
    REFERENCES courses(id) 
    ON DELETE CASCADE;