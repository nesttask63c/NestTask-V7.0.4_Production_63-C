/*
  # Create user activities tracking system

  1. New Table
    - `user_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `activity_type` (text)
      - `action` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
    - Ensure proper cascading deletion

  3. Performance
    - Add indexes for common queries
*/

-- Create user activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;

-- Create fresh policies
CREATE POLICY "Users can insert their own activities"
  ON user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id 
  ON user_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activities_type 
  ON user_activities(activity_type);