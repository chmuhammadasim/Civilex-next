-- ============================================================
-- Migration: 00035_document_client_edit_delete.sql
--
-- Allows clients (plaintiff/defendant) to edit and delete their
-- OWN document uploads, matching what lawyers and judges can do.
-- ============================================================

-- UPDATE: client can update their own uploads on their own case
CREATE POLICY "docs_update_client" ON public.documents
  FOR UPDATE USING (
    auth.uid() = uploaded_by
    AND get_user_role() = 'client'
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id
        AND (c.plaintiff_id = auth.uid() OR c.defendant_id = auth.uid())
    )
  );

-- DELETE: client can delete their own uploads on their own case
CREATE POLICY "docs_delete_client" ON public.documents
  FOR DELETE USING (
    auth.uid() = uploaded_by
    AND get_user_role() = 'client'
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = documents.case_id
        AND (c.plaintiff_id = auth.uid() OR c.defendant_id = auth.uid())
    )
  );
