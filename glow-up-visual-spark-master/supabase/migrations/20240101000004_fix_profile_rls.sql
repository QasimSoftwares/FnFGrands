-- Create a function to safely get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE id = user_id;
$$;

-- Create a function to safely update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id uuid,
  profile_updates jsonb
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  UPDATE profiles
  SET 
    full_name = COALESCE(profile_updates->>'full_name', full_name),
    avatar_url = COALESCE(profile_updates->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING * INTO updated_profile;
  
  RETURN updated_profile;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, jsonb) TO authenticated;
