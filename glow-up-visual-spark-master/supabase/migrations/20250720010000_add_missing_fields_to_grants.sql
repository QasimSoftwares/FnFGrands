-- Add missing fields to grants table
ALTER TABLE public.grants 
ADD COLUMN IF NOT EXISTS applied_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responsible_person TEXT,
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_notes TEXT;

-- Update the type to include the new fields
type grants_update_column = 
  | 'applied_date'
  | 'next_follow_up'
  | 'responsible_person'
  | 'attachment_count'
  | 'progress_notes';

-- Update the grants table type definition
DROP TYPE IF EXISTS grants_update_column CASCADE;
CREATE TYPE grants_update_column AS ENUM (
  'applied_date',
  'next_follow_up',
  'responsible_person',
  'attachment_count',
  'progress_notes'
);

-- Update the grants table to make applied_date required
ALTER TABLE public.grants 
ALTER COLUMN applied_date SET NOT NULL;
