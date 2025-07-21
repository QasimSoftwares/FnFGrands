-- Create a function to get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
BEGIN
  SELECT to_jsonb(profiles.*) INTO profile_data
  FROM public.profiles
  WHERE profiles.id = user_id;
  
  RETURN profile_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO authenticated;
