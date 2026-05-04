-- ============================================================
-- Migration 00037: link_defendant_by_email RPC
--
-- Matches the authenticated user's email against cases where
-- defendant_email is set but defendant_id is NULL, then links
-- them. Uses SECURITY DEFINER so it can bypass RLS (the user
-- is not yet linked, so their session client sees zero rows).
-- auth.uid() is used inside the function so it can only act
-- on behalf of the calling user — no privilege escalation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_defendant_by_email()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid   := auth.uid();
  v_email     text;
  v_full_name text;
  v_case      record;
  v_linked    integer := 0;
  v_cases     jsonb   := '[]'::jsonb;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('linked', 0, 'cases', '[]'::jsonb);
  END IF;

  -- Only act for 'client' role
  SELECT email, full_name
  INTO   v_email, v_full_name
  FROM   profiles
  WHERE  id = v_user_id
    AND  role = 'client';

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('linked', 0, 'cases', '[]'::jsonb);
  END IF;

  -- Find every case where defendant_email matches and defendant_id is NULL
  FOR v_case IN
    SELECT id, case_number, title, plaintiff_id
    FROM   cases
    WHERE  defendant_email = v_email
      AND  defendant_id IS NULL
      AND  plaintiff_id <> v_user_id   -- can't be defendant of own case
  LOOP
    UPDATE cases
    SET    defendant_id              = v_user_id,
           defendant_claim_token     = NULL,
           defendant_claim_expires_at = NULL
    WHERE  id             = v_case.id
      AND  defendant_id IS NULL;       -- double-check (concurrent safety)

    IF FOUND THEN
      v_linked := v_linked + 1;
      v_cases  := v_cases || jsonb_build_object(
        'id',          v_case.id,
        'case_number', v_case.case_number,
        'title',       v_case.title
      );

      -- Activity log
      INSERT INTO case_activity_log(case_id, actor_id, action, details)
      VALUES (
        v_case.id,
        v_user_id,
        'defendant_auto_linked',
        jsonb_build_object(
          'matched_email',  v_email,
          'defendant_name', v_full_name
        )
      );

      -- Notify plaintiff
      IF v_case.plaintiff_id IS NOT NULL THEN
        INSERT INTO notifications(
          user_id, title, message,
          type, reference_type, reference_id
        ) VALUES (
          v_case.plaintiff_id,
          'Defendant Registered',
          format(
            'The defendant "%s" has registered for case "%s" (%s).',
            v_full_name, v_case.title, v_case.case_number
          ),
          'case_status_changed',
          'case',
          v_case.id
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('linked', v_linked, 'cases', v_cases);
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.link_defendant_by_email() TO authenticated;
