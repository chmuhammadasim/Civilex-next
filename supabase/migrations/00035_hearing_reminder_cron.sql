-- Hearing Reminder Notifications via pg_cron
-- NOTE: pg_cron is available on Supabase Pro plan and above.
-- On free/hobby plans, this extension may not be available.
-- As a fallback, the /api/cron/hearing-reminders endpoint can be called by an external cron (e.g., GitHub Actions, Vercel Cron).

-- Enable pg_cron extension (must be run as superuser; Supabase handles this)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- Function: send_hearing_reminders
-- Inserts in-app notifications for all case parties when a
-- hearing is scheduled for tomorrow.
-- ============================================================
CREATE OR REPLACE FUNCTION send_hearing_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  party_id UUID;
  party_ids UUID[];
  assignment RECORD;
BEGIN
  -- Loop over all hearings scheduled for tomorrow that are still "scheduled"
  FOR rec IN
    SELECT
      h.id          AS hearing_id,
      h.case_id,
      h.hearing_number,
      h.hearing_type,
      h.scheduled_date,
      c.title       AS case_title,
      c.case_number,
      c.plaintiff_id,
      c.defendant_id
    FROM hearings h
    JOIN cases c ON c.id = h.case_id
    WHERE h.scheduled_date::date = CURRENT_DATE + INTERVAL '1 day'
      AND h.status = 'scheduled'
  LOOP
    -- Collect party IDs
    party_ids := ARRAY[]::UUID[];

    IF rec.plaintiff_id IS NOT NULL THEN
      party_ids := party_ids || rec.plaintiff_id;
    END IF;

    IF rec.defendant_id IS NOT NULL THEN
      party_ids := party_ids || rec.defendant_id;
    END IF;

    -- Add accepted lawyers
    FOR assignment IN
      SELECT lawyer_id FROM case_assignments
      WHERE case_id = rec.case_id AND status = 'accepted'
    LOOP
      IF NOT (assignment.lawyer_id = ANY(party_ids)) THEN
        party_ids := party_ids || assignment.lawyer_id;
      END IF;
    END LOOP;

    -- Insert a notification for each party
    FOREACH party_id IN ARRAY party_ids LOOP
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        party_id,
        'Hearing Reminder — Tomorrow',
        format(
          'Reminder: Hearing #%s (%s) for case "%s" (%s) is scheduled for tomorrow, %s.',
          rec.hearing_number,
          replace(rec.hearing_type, '_', ' '),
          rec.case_title,
          rec.case_number,
          to_char(rec.scheduled_date, 'DD Mon YYYY')
        ),
        'hearing_scheduled',
        'case',
        rec.case_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- Schedule: Run daily at 8:00 AM UTC
-- ============================================================
SELECT cron.schedule(
  'send-hearing-reminders',   -- job name (unique)
  '0 8 * * *',                -- cron expression: 8 AM UTC every day
  'SELECT send_hearing_reminders()'
);
