/*
  # Fix Activity Tracking

  1. Changes
    - Add proper foreign key relationship for user_id in tasks table
    - Create activity tracking table
    - Add RLS policies
*/

-- First ensure the tasks table has the correct foreign key
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey,
ADD CONSTRAINT tasks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create activities table for tracking
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
CREATE POLICY "Allow admins to manage activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow users to read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to automatically track task activities
CREATE OR REPLACE FUNCTION handle_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (type, title, user_id, metadata)
  VALUES (
    'task',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'New task created: ' || NEW.name
      WHEN TG_OP = 'UPDATE' THEN 'Task updated: ' || NEW.name
      WHEN TG_OP = 'DELETE' THEN 'Task deleted: ' || OLD.name
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    jsonb_build_object(
      'task_id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      'operation', TG_OP
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for task activities
DROP TRIGGER IF EXISTS task_activity_trigger ON tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_activity();