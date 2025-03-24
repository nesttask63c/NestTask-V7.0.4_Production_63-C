/*
  # Basic Task Management Setup
  
  1. Schema
    - Create tasks table with basic fields
    - Add user reference and timestamps
    
  2. Security
    - Enable RLS
    - Set up basic CRUD policies for user's own tasks
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  due_date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies explicitly
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Create fresh policies for task management
CREATE POLICY "tasks_select_policy"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);