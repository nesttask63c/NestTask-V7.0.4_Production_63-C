/*
  # User Management Schema Update

  1. Changes
    - Creates users table with basic profile data
    - Sets up RLS policies for proper access control
    - Adds upsert handling for user profiles
  
  2. Security
    - Enables RLS
    - Grants appropriate permissions
    - Creates policies for read/write access
*/

-- Step 1: Create base table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Step 2: Add foreign key separately
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_id_fkey,
  ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Step 3: Basic security setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Step 4: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Step 5: Create upsert handler
CREATE OR REPLACE FUNCTION handle_user_upsert()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    UPDATE public.users
    SET 
      email = NEW.email,
      name = COALESCE(NEW.name, split_part(NEW.email, '@', 1)),
      last_active = now()
    WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS on_user_upsert ON users;
CREATE TRIGGER on_user_upsert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_upsert();

-- Step 7: Create basic policies
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
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 8: Create admin update policy
CREATE POLICY "Enable admin update"
  ON users FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));