-- Migration: Fix Property Registry Lookup search (idempotent)
-- Fix 1: land_case_details — open to all authenticated users
DROP POLICY IF EXISTS "land_details_select" ON public.land_case_details;
CREATE POLICY "land_details_select" ON public.land_case_details
  FOR SELECT TO authenticated USING (true);

-- Fix 2: cases — allow all authenticated users to read land cases
DROP POLICY IF EXISTS "cases_select_land_registry" ON public.cases;
CREATE POLICY "cases_select_land_registry" ON public.cases
  FOR SELECT TO authenticated
  USING (case_type IN ('land_revenue', 'land_transfer'));
