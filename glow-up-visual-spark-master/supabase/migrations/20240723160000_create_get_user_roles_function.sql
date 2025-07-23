-- Create a function to get user roles
create or replace function public.get_user_roles(user_id uuid)
returns table (role_name text)
language sql
security definer
as $$
  select ur.role::text as role_name
  from user_roles ur
  where ur.user_id = $1;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_roles(uuid) to authenticated;
