/*
  # Add Routine Management Tables

  1. New Tables
    - `routines` table for storing class schedules
    - `routine_slots` table for storing individual time slots
    
  2. Security
    - Enable RLS
    - Add policies for admin management and user read access
*/

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  semester text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create routine_slots table
CREATE TABLE IF NOT EXISTS routine_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_number text,
  section text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_day_of_week CHECK (
    day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
  )
);

-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_slots ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routine_slots_routine ON routine_slots(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_slots_course ON routine_slots(course_id);
CREATE INDEX IF NOT EXISTS idx_routine_slots_day ON routine_slots(day_of_week);

-- Policies for routines
CREATE POLICY "Enable read access for all authenticated users on routines"
  ON routines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on routines"
  ON routines FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on routines"
  ON routines FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on routines"
  ON routines FOR DELETE
  TO authenticated
  USING (is_admin());

-- Policies for routine_slots
CREATE POLICY "Enable read access for all authenticated users on routine_slots"
  ON routine_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users on routine_slots"
  ON routine_slots FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users on routine_slots"
  ON routine_slots FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Enable delete for admin users on routine_slots"
  ON routine_slots FOR DELETE
  TO authenticated
  USING (is_admin());