-- Create donation_requests table
CREATE TABLE IF NOT EXISTS public.donation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert donation requests
CREATE POLICY "Allow authenticated users to create donation requests"
ON public.donation_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow users to view their own donation requests
CREATE POLICY "Allow users to view their own donation requests"
ON public.donation_requests
FOR SELECT
TO authenticated
USING (auth.email() = email);

-- Create policy to allow admins to view all donation requests
CREATE POLICY "Allow admins to view all donation requests"
ON public.donation_requests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles_denorm 
  WHERE user_roles_denorm.user_id = auth.uid() 
  AND user_roles_denorm.role = 'admin'
));

-- Create policy to allow admins to update status of donation requests
CREATE POLICY "Allow admins to update donation requests"
ON public.donation_requests
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles_denorm 
  WHERE user_roles_denorm.user_id = auth.uid() 
  AND user_roles_denorm.role = 'admin'
));

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_donation_requests_email ON public.donation_requests(email);

-- Create index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON public.donation_requests(status);
