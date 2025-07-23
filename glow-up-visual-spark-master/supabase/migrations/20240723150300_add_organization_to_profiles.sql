-- Add organization_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN organization_id UUID 
REFERENCES public.organizations(id) 
ON DELETE SET NULL;

-- Update RLS policy to allow organization access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
