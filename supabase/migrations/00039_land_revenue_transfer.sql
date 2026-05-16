-- Migration 00039: Land Revenue and Land Transfer case support
-- Adds two new case types (land_revenue, land_transfer) to the case_type enum,
-- creates the land_case_details table, updates the case-number trigger, and
-- sets up RLS policies mirroring the existing criminal_case_details pattern.

-- ── 1. Extend case_type enum ──────────────────────────────────────────────────
ALTER TYPE public.case_type ADD VALUE IF NOT EXISTS 'land_revenue';
ALTER TYPE public.case_type ADD VALUE IF NOT EXISTS 'land_transfer';

-- ── 2. Create land_case_details table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.land_case_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,

  -- Revenue record identifiers
  khasra_number         TEXT NOT NULL,
  khewat_number         TEXT,

  -- Location hierarchy
  district              TEXT NOT NULL,
  tehsil                TEXT NOT NULL,
  mauza                 TEXT NOT NULL,

  -- Land particulars
  total_area            TEXT,
  land_type             TEXT CHECK (land_type IN ('agricultural', 'residential', 'commercial') OR land_type IS NULL),

  -- Revenue/mutation-specific
  mutation_number       TEXT,
  revenue_officer       TEXT,

  -- Transfer-specific
  registration_authority TEXT,
  deed_number           TEXT,
  deed_date             DATE,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast case_id lookup
CREATE INDEX IF NOT EXISTS idx_land_case_details_case_id
  ON public.land_case_details(case_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_land_case_details()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_land_case_details ON public.land_case_details;
CREATE TRIGGER trg_touch_land_case_details
  BEFORE UPDATE ON public.land_case_details
  FOR EACH ROW EXECUTE FUNCTION public.touch_land_case_details();

-- ── 3. Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.land_case_details ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read land details for cases they can access
CREATE POLICY "land_details_select"
  ON public.land_case_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = land_case_details.case_id
        AND (
          -- Plaintiff or defendant
          c.plaintiff_id = auth.uid()
          OR c.defendant_id = auth.uid()
          -- Assigned lawyer
          OR EXISTS (
            SELECT 1 FROM public.case_assignments ca
            WHERE ca.case_id = c.id
              AND ca.lawyer_id = auth.uid()
              AND ca.status != 'declined'
          )
          -- Court staff
          OR c.admin_court_id = auth.uid()
          OR c.trial_judge_id = auth.uid()
          OR c.stenographer_id = auth.uid()
          -- admin_court and magistrate roles see all
          OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_court', 'magistrate', 'trial_judge')
        )
    )
  );

-- Only the filing client (or service-role) can insert land details
CREATE POLICY "land_details_insert"
  ON public.land_case_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = land_case_details.case_id
        AND c.plaintiff_id = auth.uid()
    )
  );

-- Only service role or the filing client can update
CREATE POLICY "land_details_update"
  ON public.land_case_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = land_case_details.case_id
        AND c.plaintiff_id = auth.uid()
    )
  );

-- ── 4. Update case-number trigger to handle new types ─────────────────────────
CREATE OR REPLACE FUNCTION public.auto_generate_case_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix   TEXT;
  seq      INTEGER;
  lock_key BIGINT;
BEGIN
  -- Only generate if case_number is NULL or empty
  IF NEW.case_number IS NOT NULL AND NEW.case_number != '' THEN
    RETURN NEW;
  END IF;

  prefix := CASE NEW.case_type
    WHEN 'civil'          THEN 'CIV'
    WHEN 'criminal'       THEN 'CRM'
    WHEN 'family'         THEN 'FAM'
    WHEN 'land_revenue'   THEN 'LRV'
    WHEN 'land_transfer'  THEN 'LTR'
    ELSE 'CAS'
  END;

  -- Advisory lock keyed by case_type to prevent concurrent duplicates
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

  NEW.case_number := prefix || '-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(seq::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE  public.land_case_details IS 'Revenue record and deed details for land revenue / land transfer cases.';
COMMENT ON COLUMN public.land_case_details.khasra_number IS 'Plot number in the village revenue record (Khasra No.)';
COMMENT ON COLUMN public.land_case_details.khewat_number IS 'Ownership record number (Khewat / Khatauni)';
COMMENT ON COLUMN public.land_case_details.mutation_number IS 'Intiqal number — required for land_mutation sub-type cases';
