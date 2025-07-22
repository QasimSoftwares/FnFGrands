-- Migration to convert from normalized user_roles to denormalized user_roles_denorm
-- This migration will:
-- 1. Create a new denormalized table
-- 2. Migrate existing data
-- 3. Set up proper constraints and indexes
-- 4. Create a view for backward compatibility

-- Step 1: Create the new denormalized table
CREATE TABLE IF NOT EXISTS public.user_roles_denorm (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_viewer BOOLEAN NOT NULL DEFAULT false,
  is_clerk BOOLEAN NOT NULL DEFAULT false,
  is_donor BOOLEAN NOT NULL DEFAULT false,
  is_member BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to update updated_at
CREATE TRIGGER update_user_roles_denorm_updated_at
BEFORE UPDATE ON public.user_roles_denorm
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Migrate existing data
DO $$
DECLARE
  user_role RECORD;
  has_admin BOOLEAN;
  has_viewer BOOLEAN;
  has_clerk BOOLEAN;
  has_donor BOOLEAN;
  has_member BOOLEAN;
BEGIN
  -- For each user with roles, create a denormalized row
  FOR user_role IN 
    SELECT DISTINCT user_id FROM user_roles
  LOOP
    -- Check each role for this user
    SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_role.user_id AND role = 'admin') INTO has_admin;
    SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_role.user_id AND role = 'viewer') INTO has_viewer;
    SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_role.user_id AND role = 'clerk') INTO has_clerk;
    SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_role.user_id AND role = 'donor') INTO has_donor;
    SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_role.user_id AND role = 'member') INTO has_member;
    
    -- Insert the denormalized row
    INSERT INTO public.user_roles_denorm (
      user_id, 
      is_admin, 
      is_viewer, 
      is_clerk, 
      is_donor, 
      is_member,
      created_at
    ) VALUES (
      user_role.user_id,
      COALESCE(has_admin, false),
      COALESCE(has_viewer, false),
      COALESCE(has_clerk, false),
      COALESCE(has_donor, false),
      COALESCE(has_member, false),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Successfully migrated roles to denormalized table';
END $$;

-- Step 5: Create a view for backward compatibility
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  user_id,
  'admin' AS role
FROM public.user_roles_denorm
WHERE is_admin = true
UNION ALL
SELECT 
  user_id,
  'viewer' AS role
FROM public.user_roles_denorm
WHERE is_viewer = true
UNION ALL
SELECT 
  user_id,
  'clerk' AS role
FROM public.user_roles_denorm
WHERE is_clerk = true
UNION ALL
SELECT 
  user_id,
  'donor' AS role
FROM public.user_roles_denorm
WHERE is_donor = true
UNION ALL
SELECT 
  user_id,
  'member' AS role
FROM public.user_roles_denorm
WHERE is_member = true;

-- Step 6: Create RLS policies for the new table
ALTER TABLE public.user_roles_denorm ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles_denorm
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles_denorm
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles_denorm 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Step 7: Create a function to get user roles as an array
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  roles TEXT[] := '{}';
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = p_user_id AND is_admin) THEN
    roles := array_append(roles, 'admin');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = p_user_id AND is_viewer) THEN
    roles := array_append(roles, 'viewer');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = p_user_id AND is_clerk) THEN
    roles := array_append(roles, 'clerk');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = p_user_id AND is_donor) THEN
    roles := array_append(roles, 'donor');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = p_user_id AND is_member) THEN
    roles := array_append(roles, 'member');
  END IF;
  
  RETURN roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create a function to check if a user has a role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles_denorm 
    WHERE user_id = p_user_id 
    AND (
      (p_role = 'admin' AND is_admin = true) OR
      (p_role = 'viewer' AND is_viewer = true) OR
      (p_role = 'clerk' AND is_clerk = true) OR
      (p_role = 'donor' AND is_donor = true) OR
      (p_role = 'member' AND is_member = true)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create a function to add a role to a user
CREATE OR REPLACE FUNCTION public.add_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE public.user_roles_denorm SET is_%I = true, updated_at = NOW() WHERE user_id = $1', p_role)
  USING p_user_id;
  
  -- If no rows were updated, insert a new row
  IF NOT FOUND THEN
    EXECUTE format('INSERT INTO public.user_roles_denorm (user_id, is_%I) VALUES ($1, true)', p_role)
    USING p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create a function to remove a role from a user
CREATE OR REPLACE FUNCTION public.remove_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE public.user_roles_denorm SET is_%I = false, updated_at = NOW() WHERE user_id = $1', p_role)
  USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create a function to set multiple roles at once
CREATE OR REPLACE FUNCTION public.set_user_roles(
  p_user_id UUID,
  p_is_admin BOOLEAN DEFAULT NULL,
  p_is_viewer BOOLEAN DEFAULT NULL,
  p_is_clerk BOOLEAN DEFAULT NULL,
  p_is_donor BOOLEAN DEFAULT NULL,
  p_is_member BOOLEAN DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  update_query TEXT := 'UPDATE public.user_roles_denorm SET ';
  set_clauses TEXT[] := '{}';
  has_updates BOOLEAN := false;
BEGIN
  -- Build the dynamic update query
  IF p_is_admin IS NOT NULL THEN
    set_clauses := array_append(set_clauses, 'is_admin = ' || p_is_admin::TEXT);
    has_updates := true;
  END IF;
  
  IF p_is_viewer IS NOT NULL THEN
    set_clauses := array_append(set_clauses, 'is_viewer = ' || p_is_viewer::TEXT);
    has_updates := true;
  END IF;
  
  IF p_is_clerk IS NOT NULL THEN
    set_clauses := array_append(set_clauses, 'is_clerk = ' || p_is_clerk::TEXT);
    has_updates := true;
  END IF;
  
  IF p_is_donor IS NOT NULL THEN
    set_clauses := array_append(set_clauses, 'is_donor = ' || p_is_donor::TEXT);
    has_updates := true;
  END IF;
  
  IF p_is_member IS NOT NULL THEN
    set_clauses := array_append(set_clauses, 'is_member = ' || p_is_member::TEXT);
    has_updates := true;
  END IF;
  
  IF has_updates THEN
    -- Add updated_at to the set clauses
    set_clauses := array_append(set_clauses, 'updated_at = NOW()');
    
    -- Build and execute the update query
    update_query := update_query || array_to_string(set_clauses, ', ') || ' WHERE user_id = $1';
    EXECUTE update_query USING p_user_id;
    
    -- If no rows were updated, insert a new row
    IF NOT FOUND THEN
      INSERT INTO public.user_roles_denorm (
        user_id,
        is_admin,
        is_viewer,
        is_clerk,
        is_donor,
        is_member
      ) VALUES (
        p_user_id,
        COALESCE(p_is_admin, false),
        COALESCE(p_is_viewer, false),
        COALESCE(p_is_clerk, false),
        COALESCE(p_is_donor, false),
        COALESCE(p_is_member, false)
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create a function to get all users with a specific role
CREATE OR REPLACE FUNCTION public.get_users_with_role(p_role TEXT)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT user_id FROM public.user_roles_denorm WHERE is_%I = true', p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles_denorm TO authenticated_user, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated_user, service_role;

-- Step 14: Create a function to migrate back to the old structure if needed
CREATE OR REPLACE FUNCTION public.migrate_to_normalized_roles()
RETURNS VOID AS $$
BEGIN
  -- This function would be used to migrate back to the normalized structure if needed
  RAISE NOTICE 'Migration to normalized roles not implemented. This is a placeholder function.';
END;
$$ LANGUAGE plpgsql;
