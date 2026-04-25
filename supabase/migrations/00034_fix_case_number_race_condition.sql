-- Migration 00034: Fix case number generation race condition
-- Replaces client-side RPC call with a BEFORE INSERT trigger that atomically
-- generates case_number within the same transaction as the insert

-- Drop the old function (no longer needed)
DROP FUNCTION IF EXISTS public.generate_case_number(public.case_type);

-- Create new trigger function that runs BEFORE INSERT
-- SECURITY DEFINER ensures it bypasses RLS policies
CREATE OR REPLACE FUNCTION public.auto_generate_case_number()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  seq    INTEGER;
  lock_key BIGINT;
BEGIN
  -- Only generate if case_number is NULL or empty
  IF NEW.case_number IS NOT NULL AND NEW.case_number != '' THEN
    RETURN NEW;
  END IF;

  prefix := CASE NEW.case_type
    WHEN 'civil'    THEN 'CIV'
    WHEN 'criminal' THEN 'CRM'
    WHEN 'family'   THEN 'FAM'
    ELSE 'CAS'
  END;

  -- Advisory lock keyed by case_type to prevent concurrent duplicates
  -- Lock is held for the duration of the transaction (including the INSERT)
  lock_key := hashtext(NEW.case_type::TEXT);
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Find next sequence number for this case type and year
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(case_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM public.cases
  WHERE case_type = NEW.case_type
    AND SPLIT_PART(case_number, '-', 2) = EXTRACT(YEAR FROM now())::TEXT;

  -- Generate the case number
  NEW.case_number := prefix || '-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(seq::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to cases table
DROP TRIGGER IF EXISTS trigger_auto_generate_case_number ON public.cases;
CREATE TRIGGER trigger_auto_generate_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_case_number();

COMMENT ON FUNCTION public.auto_generate_case_number() IS 
  'Automatically generates unique case numbers on INSERT. Uses advisory lock to prevent race conditions.';
