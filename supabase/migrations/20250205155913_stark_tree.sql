-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;
DROP POLICY IF EXISTS "Enable self-insert" ON users;
DROP POLICY IF EXISTS "Enable self-update" ON users;
DROP POLICY IF EXISTS "Enable admin update" ON users;
DROP POLICY IF EXISTS "Enable delete for admins" ON users;
DROP POLICY IF EXISTS "Enable admin deletion" ON users;

-- Create updated policies
CREATE POLICY "Enable read access for all authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable self-insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable self-update"
  ON users FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create single admin deletion policy
CREATE POLICY "Enable delete for admins"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Update delete_user function to handle deletion properly
DROP FUNCTION IF EXISTS delete_user(UUID);
CREATE FUNCTION delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete from public.users first (this will cascade to related tables)
  DELETE FROM public.users WHERE id = user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;