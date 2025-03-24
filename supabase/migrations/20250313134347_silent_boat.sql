/*
  # Add Teacher Management

  1. New Tables
    - `teachers` table for storing teacher information
    - Add relationships with courses table
    
  2. Security
    - Enable RLS
    - Add policies for admin management and user read access
*/

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
  -- Drop teacher policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users on teachers" ON teachers;
  DROP POLICY IF EXISTS "Enable insert for admin users on teachers" ON teachers;
  DROP POLICY IF EXISTS "Enable update for admin users on teachers" ON teachers;
  DROP POLICY IF EXISTS "Enable delete for admin users on teachers" ON teachers;
  
  -- Drop teacher_courses policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users on teacher_courses" ON teacher_courses;
  DROP POLICY IF EXISTS "Enable insert for admin users on teacher_courses" ON teacher_courses;
  DROP POLICY IF EXISTS "Enable update for admin users on teacher_courses" ON teacher_courses;
  DROP POLICY IF EXISTS "Enable delete for admin users on teacher_courses" ON teacher_courses;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create teachers table if it doesn't exist
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  department text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add teacher_id to courses table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE courses 
    ADD COLUMN teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create teacher_courses junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_courses (
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (teacher_id, course_id)
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_courses ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON teacher_courses(course_id);

-- Create fresh policies for teachers
CREATE POLICY "Enable read access for all authenticated users on teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on teachers"
  ON teachers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on teachers"
  ON teachers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create fresh policies for teacher_courses
CREATE POLICY "Enable read access for all authenticated users on teacher_courses"
  ON teacher_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on teacher_courses"
  ON teacher_courses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on teacher_courses"
  ON teacher_courses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on teacher_courses"
  ON teacher_courses FOR DELETE
  TO authenticated
  USING (is_admin());