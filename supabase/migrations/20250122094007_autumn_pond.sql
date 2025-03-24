-- Create function to delete users safely
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  executing_user_role text;
BEGIN
  -- Get the role of the executing user
  SELECT raw_user_meta_data->>'role'
  INTO executing_user_role
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if the executing user is an admin
  IF executing_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete from public.users first (this will cascade to auth.users)
  DELETE FROM public.users WHERE id = user_id;
  
  -- Delete from auth.users using Supabase's built-in function
  -- This requires the executing user to have admin privileges
  PERFORM auth.users WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;

-- Create admin-only policy for user deletion
DROP POLICY IF EXISTS "Enable delete for admins" ON users;
CREATE POLICY "Enable delete for admins"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());