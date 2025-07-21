-- Add outcome_summary column and migrate data from summary field
ALTER TABLE public.grants ADD COLUMN IF NOT EXISTS outcome_summary TEXT NULL, DROP COLUMN IF EXISTS outcome, DROP COLUMN IF EXISTS summary;
