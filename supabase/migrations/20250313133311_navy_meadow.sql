/*
  # Add Teacher Management

  1. New Tables
    - `teachers` table for storing teacher information
    - Add relationships with courses table
    
  2. Security
    - Enable RLS
    - Add policies for admin management and user read access
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  department text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add teacher_id to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;

-- Create teacher_courses junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS teacher_courses (
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (teacher_id, course_id)
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_courses ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON teacher_courses(course_id);

-- Policies for teachers
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

-- Policies for teacher_courses
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