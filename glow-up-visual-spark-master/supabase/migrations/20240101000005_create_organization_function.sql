-- Create a function to get or create an organization for a user
create or replace function public.get_or_create_user_organization(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
  declare
    v_organization_id uuid;
    v_user_org_id uuid;
  begin
    -- Check if user already has an organization
    select organization_id 
    into v_organization_id
    from public.profiles 
    where id = p_user_id;
    
    -- If user has an organization, return it
    if v_organization_id is not null then
      return json_build_object('organization_id', v_organization_id);
    end if;
    
    -- Create a new organization for the user
    insert into public.organizations (name, created_by)
    values (
      'My Organization', 
      p_user_id
    )
    returning id into v_organization_id;
    
    -- Update user's profile with the new organization
    update public.profiles
    set organization_id = v_organization_id
    where id = p_user_id;
    
    -- Return the new organization ID
    return json_build_object('organization_id', v_organization_id);
  exception when others then
    raise warning 'Error in get_or_create_user_organization: %', sqlerrm;
    return null;
  end;
$$;

-- Grant execute permission to authenticated users
revoke all on function public.get_or_create_user_organization from public;
grant execute on function public.get_or_create_user_organization to authenticated;

-- Create organizations table if it doesn't exist
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Add organization_id column to profiles if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns 
                where table_schema = 'public' 
                and table_name = 'profiles' 
                and column_name = 'organization_id') then
    alter table public.profiles 
    add column organization_id uuid references public.organizations(id) on delete set null;
  end if;
end $$;
