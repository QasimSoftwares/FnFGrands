-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer';
  END IF;
END $$;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're up to date
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to insert their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Allow users to insert their own profile" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Allow users to update their own profile" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to read their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Allow users to read their own profile" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin full access to all profiles' AND tablename = 'profiles') THEN
    DROP POLICY "Allow admin full access to all profiles" ON profiles;
  END IF;
  
  -- Allow public access to profiles (temporarily for admin setup)
  CREATE POLICY "Allow public access to profiles"
  ON profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
  
  -- Recreate all policies with proper security
  CREATE POLICY "Allow users to read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
  
  CREATE POLICY "Allow users to update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  
  -- Create a function to check admin status without causing recursion
  CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean AS $$
  DECLARE
    is_admin boolean;
  BEGIN
    SELECT role = 'admin' INTO is_admin
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(is_admin, false);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Admin policy using the function
  CREATE POLICY "Allow admin full access to all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
  
  -- Remove the temporary public access policy
  DROP POLICY IF EXISTS "Allow public access to profiles" ON profiles;
  
  -- Create a trigger function to handle profile creation on signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
      'viewer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Create the trigger if it doesn't exist
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
  -- Grant necessary permissions
  GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
  
  -- Allow authenticated users to read public data
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO authenticated;
  
  -- Allow authenticated users to execute functions
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
  
  -- Notify that the migration is complete
  RAISE NOTICE 'Policies and triggers have been updated successfully';
END $$;
