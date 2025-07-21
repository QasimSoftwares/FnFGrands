-- Migration script to move from single role to multiple roles
-- This script should be run after the user_roles table is created

-- First, create a function to migrate existing roles
CREATE OR REPLACE FUNCTION migrate_existing_roles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  role_count INTEGER;
BEGIN
  -- Check if we've already migrated
  SELECT COUNT(*) INTO role_count FROM user_roles;
  
  IF role_count = 0 THEN
    -- Only migrate if we haven't done it before
    RAISE NOTICE 'Migrating existing roles to user_roles table...';
    
    -- For each user in the profiles table, add their role to user_roles
    FOR user_record IN 
      SELECT id, role 
      FROM profiles 
      WHERE role IS NOT NULL
    LOOP
      -- Insert the role into user_roles if it doesn't exist
      INSERT INTO user_roles (id, role)
      VALUES (user_record.id, user_record.role)
      ON CONFLICT (id, role) DO NOTHING;
      
      RAISE NOTICE 'Migrated role % for user %', user_record.role, user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Role migration completed successfully.';
  ELSE
    RAISE NOTICE 'Roles already migrated, skipping...';
  END IF;
  
  RETURN;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error during role migration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the migration function
SELECT migrate_existing_roles();

-- Create a trigger to automatically add new users to the user_roles table
-- with their default role (if any)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert the default role from profiles into user_roles
  IF NEW.role IS NOT NULL THEN
    INSERT INTO user_roles (id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create a function to get user roles as an array
CREATE OR REPLACE FUNCTION get_user_roles(user_id uuid)
RETURNS text[] AS $$
  SELECT array_agg(role) 
  FROM user_roles 
  WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;
