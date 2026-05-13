-- Fix: written_statements_update RLS WITH CHECK
--
-- Root cause: the original policy only specified USING, so PostgreSQL
-- implicitly applied the same expression as WITH CHECK.  After a lawyer
-- updates status → 'filed', the implicit WITH CHECK evaluates the NEW row
-- which now has status = 'filed', causing `status = 'draft'` to be FALSE
-- and the update to be rejected with a row-level-security violation.
--
-- Fix: drop the old policy and recreate it with an explicit WITH CHECK that
-- only verifies ownership (not the draft status) so lawyers can advance from
-- 'draft' → 'filed'.

DROP POLICY IF EXISTS "written_statements_update" ON public.written_statements;

CREATE POLICY "written_statements_update" ON public.written_statements
  FOR UPDATE
  -- USING: only allow targeting rows that are still drafts owned by this user
  --        OR rows that a court official wants to modify.
  USING (
    (filed_by = auth.uid() AND status = 'draft')
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  )
  -- WITH CHECK: validate the new row — the filer can set any status
  --             (including 'filed'); court officials can always write.
  WITH CHECK (
    filed_by = auth.uid()
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );
