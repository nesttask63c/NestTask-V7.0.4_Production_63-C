-- Drop existing function
DROP FUNCTION IF EXISTS get_user_stats();

-- Create updated function
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total_users integer;
  active_today integer;
  new_this_week integer;
BEGIN
  -- Get total users
  SELECT COUNT(*) INTO total_users 
  FROM users;
  
  -- Get users active today (based on last_active timestamp)
  SELECT COUNT(*) INTO active_today 
  FROM users 
  WHERE last_active >= CURRENT_DATE;
  
  -- Get new users this week
  SELECT COUNT(*) INTO new_this_week 
  FROM users 
  WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days');
  
  RETURN json_build_object(
    'total_users', total_users,
    'active_today', active_today,
    'new_this_week', new_this_week
  );
END;
$$;

-- Update last_active trigger to properly track user activity
CREATE OR REPLACE FUNCTION handle_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET last_active = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_activity ON auth.users;
CREATE TRIGGER on_auth_user_activity
  AFTER UPDATE OF last_sign_in_at, updated_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_activity();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
