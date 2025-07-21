-- Add attachment_count column to grants table
ALTER TABLE grants
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0;
