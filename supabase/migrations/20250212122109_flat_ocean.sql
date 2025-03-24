-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  teacher text NOT NULL,
  class_time text NOT NULL,
  telegram_group text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create study materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  category text NOT NULL,
  file_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Policies for courses
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

-- Policies for study materials
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_study_materials_course ON study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON study_materials(category);