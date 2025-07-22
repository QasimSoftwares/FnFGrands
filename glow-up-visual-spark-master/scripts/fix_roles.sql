-- Script to fix role-related issues

-- 1. Check if user_roles_denorm table exists
SELECT 'Checking if user_roles_denorm table exists...' AS message;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE  table_schema = 'public'
  AND    table_name   = 'user_roles_denorm'
) AS table_exists;

-- 2. Create the denormalized table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles_denorm') THEN
    RAISE NOTICE 'Creating user_roles_denorm table...';
    
    CREATE TABLE public.user_roles_denorm (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      is_viewer BOOLEAN NOT NULL DEFAULT false,
      is_clerk BOOLEAN NOT NULL DEFAULT false,
      is_donor BOOLEAN NOT NULL DEFAULT false,
      is_member BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_user_roles_denorm_user_id ON public.user_roles_denorm (user_id);
    
    -- Create trigger function for updated_at
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger
    CREATE TRIGGER update_user_roles_denorm_updated_at
    BEFORE UPDATE ON public.user_roles_denorm
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
    
    RAISE NOTICE 'user_roles_denorm table created successfully';
  ELSE
    RAISE NOTICE 'user_roles_denorm table already exists';
  END IF;
END $$;

-- 3. Check existing users and their roles
SELECT 'Checking existing users and their roles...' AS message;

SELECT 
  u.id,
  u.email,
  array_agg(ur.role) AS current_roles,
  urd.*
FROM 
  auth.users u
LEFT JOIN 
  public.user_roles ur ON u.id = ur.id
LEFT JOIN 
  public.user_roles_denorm urd ON u.id = urd.user_id
GROUP BY 
  u.id, u.email, urd.*;

-- 4. Migrate data from user_roles to user_roles_denorm
DO $$
DECLARE
  user_record RECORD;
  user_count INT := 0;
  updated_count INT := 0;
  new_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting data migration from user_roles to user_roles_denorm...';
  
  -- Loop through each user with roles
  FOR user_record IN 
    SELECT 
      u.id,
      u.email,
      bool_or(ur.role = 'admin') AS is_admin,
      bool_or(ur.role = 'viewer') AS is_viewer,
      bool_or(ur.role = 'clerk') AS is_clerk,
      bool_or(ur.role = 'donor') AS is_donor,
      bool_or(ur.role = 'member') AS is_member
    FROM 
      auth.users u
    LEFT JOIN 
      public.user_roles ur ON u.id = ur.id
    GROUP BY 
      u.id, u.email
  LOOP
    user_count := user_count + 1;
    
    -- Check if user already exists in denorm table
    IF EXISTS (SELECT 1 FROM public.user_roles_denorm WHERE user_id = user_record.id) THEN
      -- Update existing record
      UPDATE public.user_roles_denorm
      SET 
        is_admin = user_record.is_admin,
        is_viewer = user_record.is_viewer,
        is_clerk = user_record.is_clerk,
        is_donor = user_record.is_donor,
        is_member = user_record.is_member,
        updated_at = NOW()
      WHERE user_id = user_record.id;
      
      updated_count := updated_count + 1;
    ELSE
      -- Insert new record
      INSERT INTO public.user_roles_denorm (
        user_id, 
        is_admin, 
        is_viewer, 
        is_clerk, 
        is_donor, 
        is_member
      ) VALUES (
        user_record.id,
        COALESCE(user_record.is_admin, false),
        COALESCE(user_record.is_viewer, false),
        COALESCE(user_record.is_clerk, false),
        COALESCE(user_record.is_donor, false),
        COALESCE(user_record.is_member, false)
      );
      
      new_count := new_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete. Processed % users: % updated, % new records', 
    user_count, updated_count, new_count;
    
  -- If no users had roles, ensure at least one admin exists
  IF user_count = 0 THEN
    RAISE NOTICE 'No users with roles found. Creating default admin user...';
    
    -- Find the first user (should be you)
    DECLARE
      first_user_id UUID;
    BEGIN
      SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
      
      IF FOUND THEN
        -- Insert admin role for the first user
        INSERT INTO public.user_roles_denorm (
          user_id, 
          is_admin, 
          is_viewer, 
          is_clerk, 
          is_donor, 
          is_member
        ) VALUES (
          first_user_id,
          true,   -- is_admin
          true,   -- is_viewer
          false,  -- is_clerk
          false,  -- is_donor
          false   -- is_member
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          is_admin = EXCLUDED.is_admin,
          is_viewer = EXCLUDED.is_viewer,
          is_clerk = EXCLUDED.is_clerk,
          is_donor = EXCLUDED.is_donor,
          is_member = EXCLUDED.is_member,
          updated_at = NOW();
          
        RAISE NOTICE 'Assigned admin role to user %', first_user_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error creating default admin: %', SQLERRM;
    END;
  END IF;
END $$;

-- 5. Verify the migration
SELECT 'Verifying migration results...' AS message;

SELECT 
  u.id,
  u.email,
  array_remove(array[
    CASE WHEN urd.is_admin THEN 'admin' END,
    CASE WHEN urd.is_viewer THEN 'viewer' END,
    CASE WHEN urd.is_clerk THEN 'clerk' END,
    CASE WHEN urd.is_donor THEN 'donor' END,
    CASE WHEN urd.is_member THEN 'member' END
  ], NULL) AS denormalized_roles,
  array_agg(ur.role) AS original_roles
FROM 
  auth.users u
LEFT JOIN 
  public.user_roles_denorm urd ON u.id = urd.user_id
LEFT JOIN 
  public.user_roles ur ON u.id = ur.id
GROUP BY 
  u.id, u.email, urd.*
ORDER BY 
  u.created_at DESC;

-- 6. Set up RLS policies for the denormalized table
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.user_roles_denorm ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles_denorm;
  DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles_denorm;
  
  -- Create policies
  CREATE POLICY "Users can view their own roles"
    ON public.user_roles_denorm
    FOR SELECT
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Admins can manage all roles"
    ON public.user_roles_denorm
    FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.user_roles_denorm 
      WHERE user_id = auth.uid() AND is_admin = true
    ));
    
  RAISE NOTICE 'RLS policies for user_roles_denorm have been updated';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error setting up RLS policies: %', SQLERRM;
END $$;

-- 7. Create or replace the get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'is_admin', COALESCE(urd.is_admin, false),
    'is_viewer', COALESCE(urd.is_viewer, false),
    'is_clerk', COALESCE(urd.is_clerk, false),
    'is_donor', COALESCE(urd.is_donor, false),
    'is_member', COALESCE(urd.is_member, false)
  ) INTO result
  FROM auth.users u
  LEFT JOIN public.user_roles_denorm urd ON u.id = urd.user_id
  WHERE u.id = p_user_id;
  
  RETURN COALESCE(result, jsonb_build_object(
    'is_admin', false,
    'is_viewer', false,
    'is_clerk', false,
    'is_donor', false,
    'is_member', false
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a view for backward compatibility
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  user_id AS id,
  user_id,
  'admin' AS role
FROM public.user_roles_denorm
WHERE is_admin = true
UNION ALL
SELECT 
  user_id || '-viewer' AS id,
  user_id,
  'viewer' AS role
FROM public.user_roles_denorm
WHERE is_viewer = true
UNION ALL
SELECT 
  user_id || '-clerk' AS id,
  user_id,
  'clerk' AS role
FROM public.user_roles_denorm
WHERE is_clerk = true
UNION ALL
SELECT 
  user_id || '-donor' AS id,
  user_id,
  'donor' AS role
FROM public.user_roles_denorm
WHERE is_donor = true
UNION ALL
SELECT 
  user_id || '-member' AS id,
  user_id,
  'member' AS role
FROM public.user_roles_denorm
WHERE is_member = true;

-- 9. Grant permissions
GRANT SELECT ON public.user_roles_denorm TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles_denorm TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO anon, authenticated;

-- 10. Final status
SELECT 'Database roles setup complete. Please check the results above for any issues.' AS message;
