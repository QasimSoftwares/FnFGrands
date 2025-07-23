-- Create a function to handle donor request creation
CREATE OR REPLACE FUNCTION public.create_donor_request(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id UUID;
  result JSONB;
BEGIN
  -- Insert the donor request
  INSERT INTO public.donor_requests (user_id, status)
  VALUES (user_id, 'pending')
  RETURNING id INTO request_id;
  
  -- Update the user's profile
  UPDATE public.profiles
  SET donor_status = 'pending'
  WHERE id = user_id;
  
  -- Return the created request
  SELECT jsonb_build_object(
    'id', request_id,
    'user_id', user_id,
    'status', 'pending',
    'requested_at', NOW()
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating donor request: %', SQLERRM;
END;
$$;
