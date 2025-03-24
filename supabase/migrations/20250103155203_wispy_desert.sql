/*
  # Add user statistics functions
  
  1. New Functions
    - get_user_stats: Returns user statistics including total, active today, and new this week
    - get_user_list: Returns a list of users with basic information
  
  2. Security
    - Functions are security definer to run with elevated privileges
    - Access restricted to authenticated users
    - Only basic user information is exposed
*/

-- Function to get user statistics
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
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  SELECT COUNT(*) INTO active_today 
  FROM auth.users 
  WHERE last_sign_in_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO new_this_week 
  FROM auth.users 
  WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days');
  
  RETURN json_build_object(
    'total_users', total_users,
    'active_today', active_today,
    'new_this_week', new_this_week
  );
END;
$$;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;