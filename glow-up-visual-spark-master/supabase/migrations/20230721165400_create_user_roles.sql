-- Create user_roles table
create table if not exists public.user_roles (
  id uuid references auth.users on delete cascade not null,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, role)
);

-- Add index for faster lookups
create index if not exists idx_user_roles_id on public.user_roles (id);
create index if not exists idx_user_roles_role on public.user_roles (role);

-- Set up Row Level Security (RLS)
alter table public.user_roles enable row level security;

-- Create policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = id);

-- Function to get user's roles as an array
create or replace function public.get_user_roles(user_id uuid)
returns text[] as $$
  select array_agg(role) from public.user_roles where id = user_id;
$$ language sql security definer;

-- Update profiles table to keep backward compatibility
-- This will be removed in a future migration
comment on column public.profiles.role is 'DEPRECATED: Use user_roles table instead';
