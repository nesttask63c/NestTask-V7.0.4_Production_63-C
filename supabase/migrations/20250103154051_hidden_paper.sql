/*
  # Update RLS policies with secure admin check

  1. Changes
    - Create a secure function to check admin status
    - Update RLS policies to use the secure function
    - Remove direct auth.users table access

  2. Security
    - Use security definer function for admin check
    - Maintain RLS policies with proper security
*/

-- Create secure function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(raw_user_meta_data->>'role', '') = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO anon;

-- Update RLS policies
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Create updated policies using the secure function
CREATE POLICY "tasks_select_policy"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin_task = true OR 
    is_admin()
  );

CREATE POLICY "tasks_insert_policy"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    is_admin()
  );

CREATE POLICY "tasks_update_policy"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    is_admin()
  );

CREATE POLICY "tasks_delete_policy"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin()
  );