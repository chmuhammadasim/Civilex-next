-- ============================================================
-- Migration: Add sync_payment_status function
-- Allows clients/lawyers to sync their case status when payments are completed
-- Bypasses RLS with security definer but validates ownership first
-- ============================================================

-- Function to sync case status from payment_pending to payment_confirmed
-- when at least one payment is completed
CREATE OR REPLACE FUNCTION public.sync_payment_status(target_case_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
AS $$
DECLARE
  v_case RECORD;
  v_completed_count INT;
  v_result JSON;
BEGIN
  -- Get case details and verify ownership/access
  SELECT 
    id, 
    status, 
    case_number,
    plaintiff_id,
    defendant_id
  INTO v_case
  FROM public.cases
  WHERE id = target_case_id;

  -- Case not found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Case not found',
      'updated', false
    );
  END IF;

  -- Verify user has access (plaintiff, defendant, or assigned lawyer)
  IF NOT (
    v_case.plaintiff_id = auth.uid() 
    OR v_case.defendant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.case_assignments ca
      WHERE ca.case_id = target_case_id 
      AND ca.lawyer_id = auth.uid()
      AND ca.status IN ('accepted', 'pending')
    )
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: You are not associated with this case',
      'updated', false
    );
  END IF;

  -- Only sync if case is payment_pending
  IF v_case.status <> 'payment_pending' THEN
    RETURN json_build_object(
      'success', true,
      'error', NULL,
      'updated', false,
      'message', 'Case is not in payment_pending status'
    );
  END IF;

  -- Check if there are any completed payments
  SELECT COUNT(*) INTO v_completed_count
  FROM public.payments
  WHERE case_id = target_case_id
  AND status = 'completed';

  -- No completed payments found
  IF v_completed_count = 0 THEN
    RETURN json_build_object(
      'success', true,
      'error', NULL,
      'updated', false,
      'message', 'No completed payments found'
    );
  END IF;

  -- Update case status to payment_confirmed
  UPDATE public.cases
  SET 
    status = 'payment_confirmed',
    updated_at = NOW()
  WHERE id = target_case_id
  AND status = 'payment_pending'; -- Double-check to prevent race conditions

  -- Log activity
  INSERT INTO public.case_activity_log (case_id, actor_id, action, details)
  VALUES (
    target_case_id,
    auth.uid(),
    'payment_confirmed',
    jsonb_build_object(
      'note', 'Payment status synced: payment_pending → payment_confirmed',
      'completed_payments', v_completed_count
    )
  );

  -- Return success result
  RETURN json_build_object(
    'success', true,
    'error', NULL,
    'updated', true,
    'message', 'Case status updated to payment_confirmed',
    'case_number', v_case.case_number,
    'completed_payments', v_completed_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'updated', false
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_payment_status(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.sync_payment_status IS 
  'Sync case status from payment_pending to payment_confirmed when payments are completed. Bypasses RLS with ownership validation.';
