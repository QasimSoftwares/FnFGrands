-- Add amount_awarded column to grants table
ALTER TABLE public.grants 
ADD COLUMN amount_awarded NUMERIC(12, 2) DEFAULT NULL;

-- Update the column comment
COMMENT ON COLUMN public.grants.amount_awarded IS 'The amount that was actually awarded for this grant (may be different from requested amount)';

-- Update the RLS policy if needed
-- (Add your RLS policy updates here if necessary)
