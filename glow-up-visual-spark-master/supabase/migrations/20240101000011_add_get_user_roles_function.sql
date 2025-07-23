-- Create or replace the get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS TABLE (
  role_name text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.role as role_name,
    ur.created_at,
    ur.updated_at
  FROM user_roles ur
  WHERE ur.user_id = get_user_roles.user_id
  ORDER BY ur.created_at;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.get_user_roles IS 'Returns all roles for a given user ID';

-- Create a policy to allow users to see their own roles
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
USING (auth.uid() = user_id);
