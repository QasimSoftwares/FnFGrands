-- Create a function to handle donor request creation atomically
create or replace function public.create_donor_request(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_request_id uuid;
  v_result jsonb;
begin
  -- Insert the donor request
  insert into public.donor_requests (user_id, status)
  values (p_user_id, 'pending')
  returning id into v_request_id;
  
  -- Update the user's profile status
  update public.profiles
  set donor_status = 'pending'
  where id = p_user_id;
  
  -- Return the created request
  select to_jsonb(dr.*) into v_result
  from public.donor_requests dr
  where dr.id = v_request_id;
  
  return v_result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.create_donor_request(uuid) to authenticated;
