-- Add return_to field to scrutiny_checklist to track which side to return case to
-- Options: 'plaintiff', 'defendant', 'both'

-- Create enum for return target
DO $$ BEGIN
  CREATE TYPE public.return_target AS ENUM ('plaintiff', 'defendant', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add return_to column
ALTER TABLE public.scrutiny_checklist
  ADD COLUMN IF NOT EXISTS return_to public.return_target;

COMMENT ON COLUMN public.scrutiny_checklist.return_to IS 
'When decision is "returned", specifies who should address the issues: plaintiff lawyer, defendant lawyer, or both';
