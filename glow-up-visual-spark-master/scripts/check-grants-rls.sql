-- Check if RLS is enabled on the grants table
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'grants';

-- View all RLS policies on the grants table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
    AND tablename = 'grants';

-- Check if the current user has admin role
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data
FROM 
    auth.users 
WHERE 
    id = auth.uid();

-- Check the user's profile
SELECT * FROM public.profiles WHERE id = auth.uid();
