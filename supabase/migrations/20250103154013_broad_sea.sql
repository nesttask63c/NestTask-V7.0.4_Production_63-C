/*
  # Add is_admin_task column to tasks table

  1. Changes
    - Add `is_admin_task` boolean column to tasks table with default value false
    - Update RLS policies to allow admin users to manage all tasks

  2. Security
    - Maintain existing RLS policies
    - Add new policies for admin task management
*/

-- Add is_admin_task column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_admin_task'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_admin_task boolean DEFAULT false;
  END IF;
END $$;

-- Update RLS policies to handle admin tasks
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Create updated policies
CREATE POLICY "tasks_select_policy"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin_task = true OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks_insert_policy"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks_update_policy"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks_delete_policy"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );