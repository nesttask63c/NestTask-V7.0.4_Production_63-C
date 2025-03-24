/*
  # Announcements Table Setup

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text) 
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for admin management and user read access
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to manage announcements" ON announcements;
DROP POLICY IF EXISTS "Allow users to read announcements" ON announcements;

-- Create fresh policies
CREATE POLICY "Allow admins to manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow users to read announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);