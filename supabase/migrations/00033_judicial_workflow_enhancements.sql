-- ============================================================
-- Migration 00033: Judicial Workflow Enhancements
-- Adds:
--   1. relief_sought column on cases (petition detail)
--   2. hearing_id FK on evidence_records (per-hearing admission)
--   3. New hearing type values for the full judicial lifecycle
--   4. written_statements table (defendant's formal reply)
--   5. hearing_attendance table (per-hearing roster)
-- ============================================================

-- ── 1. Petition: relief sought ─────────────────────────────────────────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS relief_sought TEXT;

-- ── 2. Evidence: link to the hearing it was admitted at ───────────────────
ALTER TABLE public.evidence_records
  ADD COLUMN IF NOT EXISTS hearing_id UUID REFERENCES public.hearings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_hearing ON public.evidence_records(hearing_id);

-- ── 3. Hearing type enum: add judicial workflow types ─────────────────────
-- PostgreSQL requires ADD VALUE outside a transaction block; use the
-- IF NOT EXISTS guard so re-running the migration is safe.
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'framing_of_issues';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'evidence_recording';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'cross_examination';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'final_arguments';

-- ── 4. Written Statements ─────────────────────────────────────────────────
-- The defendant's lawyer files a formal reply to the plaintiff's plaint.
-- specific_responses is a JSONB array of objects:
--   { allegation_number, allegation_summary, response, admission }
--   where admission is one of: admitted | denied | not_known
CREATE TABLE IF NOT EXISTS public.written_statements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  filed_by         UUID REFERENCES public.profiles(id),
  filed_at         TIMESTAMPTZ,

  -- Current lifecycle state
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'filed')),

  -- Core content
  general_denial       TEXT,                        -- overall position statement
  specific_responses   JSONB NOT NULL DEFAULT '[]', -- per-allegation responses
  preliminary_objections TEXT,                      -- jurisdiction, limitation, etc.
  counter_arguments    TEXT,                        -- defendant's own legal arguments
  relief_sought        TEXT,                        -- what the defendant asks the court for
  witness_names        TEXT[],                      -- provisional witness list

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_written_statements_case   ON public.written_statements(case_id);
CREATE INDEX IF NOT EXISTS idx_written_statements_filer  ON public.written_statements(filed_by);
CREATE INDEX IF NOT EXISTS idx_written_statements_status ON public.written_statements(status);

CREATE TRIGGER written_statements_updated_at
  BEFORE UPDATE ON public.written_statements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.written_statements ENABLE ROW LEVEL SECURITY;

-- Anyone party to the case (plaintiff, defendant, assigned lawyer, judge, steno) can read
CREATE POLICY "written_statements_select" ON public.written_statements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = written_statements.case_id AND (
        c.plaintiff_id   = auth.uid()
        OR c.defendant_id   = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR c.admin_court_id  = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Only accepted defendant-side lawyers may insert
CREATE POLICY "written_statements_insert" ON public.written_statements
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'lawyer'
    AND EXISTS (
      SELECT 1 FROM public.case_assignments ca
      WHERE ca.case_id = written_statements.case_id
        AND ca.lawyer_id = auth.uid()
        AND ca.status    = 'accepted'
        AND ca.side      = 'defendant'
    )
  );

-- The filer may update while still draft; court officials may always update
CREATE POLICY "written_statements_update" ON public.written_statements
  FOR UPDATE USING (
    (filed_by = auth.uid() AND status = 'draft')
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );

-- ── 5. Hearing Attendance ─────────────────────────────────────────────────
-- Per-hearing roster recording who was present at each sitting.
CREATE TABLE IF NOT EXISTS public.hearing_attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id   UUID NOT NULL REFERENCES public.hearings(id) ON DELETE CASCADE,
  case_id      UUID NOT NULL REFERENCES public.cases(id)    ON DELETE CASCADE,

  person_name  TEXT NOT NULL,
  person_role  TEXT NOT NULL
                 CHECK (person_role IN (
                   'judge', 'plaintiff', 'defendant',
                   'plaintiff_lawyer', 'defendant_lawyer',
                   'stenographer', 'witness', 'other'
                 )),
  side         TEXT CHECK (side IN ('plaintiff', 'defendant', 'court', 'other')),
  is_present   BOOLEAN NOT NULL DEFAULT true,
  notes        TEXT,

  recorded_by  UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_hearing ON public.hearing_attendance(hearing_id);
CREATE INDEX IF NOT EXISTS idx_attendance_case    ON public.hearing_attendance(case_id);

-- RLS
ALTER TABLE public.hearing_attendance ENABLE ROW LEVEL SECURITY;

-- Same read access as hearings: all case parties
CREATE POLICY "attendance_select" ON public.hearing_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearing_attendance.case_id AND (
        c.plaintiff_id    = auth.uid()
        OR c.defendant_id    = auth.uid()
        OR c.trial_judge_id  = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR c.admin_court_id  = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Court staff record attendance
CREATE POLICY "attendance_insert" ON public.hearing_attendance
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Same users can edit their entries
CREATE POLICY "attendance_update" ON public.hearing_attendance
  FOR UPDATE USING (
    recorded_by = auth.uid()
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

CREATE POLICY "attendance_delete" ON public.hearing_attendance
  FOR DELETE USING (
    recorded_by = auth.uid()
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );
