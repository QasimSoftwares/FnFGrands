-- Create or replace function to get or create an organization for a user
CREATE OR REPLACE FUNCTION public.get_or_create_user_organization(
  p_user_id UUID
)
RETURNS TABLE (organization_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_org_name TEXT;
BEGIN
  -- First, try to get the user's existing organization
  SELECT organization_id INTO v_organization_id
  FROM public.profiles
  WHERE id = p_user_id;

  -- If user already has an organization, return it
  IF v_organization_id IS NOT NULL THEN
    RETURN QUERY SELECT v_organization_id;
    RETURN;
  END IF;

  -- Get user details for organization name
  SELECT email, COALESCE(full_name, '') INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = p_user_id;

  -- Create organization name from user's name or email
  IF v_user_name IS NOT NULL AND v_user_name <> '' THEN
    v_org_name := v_user_name || '''s Organization';
  ELSE
    v_org_name := 'Organization for ' || split_part(v_user_email, '@', 1);
  END IF;

  -- Create a new organization
  INSERT INTO public.organizations (name, created_by)
  VALUES (v_org_name, p_user_id)
  RETURNING id INTO v_organization_id;

  -- Update the user's profile with the new organization
  UPDATE public.profiles
  SET organization_id = v_organization_id
  WHERE id = p_user_id;

  -- Return the new organization ID
  RETURN QUERY SELECT v_organization_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_user_organization(UUID) TO authenticated;
