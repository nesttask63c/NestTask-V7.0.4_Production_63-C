/*
  # Admin functionality setup
  
  1. Changes
    - Creates function to check if admin exists
    - Sets up admin role type
  
  2. Security
    - Function is security definer
    - Explicit grants for authenticated and anon roles
*/

-- Function to check if admin exists
CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_admin_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_exists TO anon;

-- Create admin role type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END
$$;