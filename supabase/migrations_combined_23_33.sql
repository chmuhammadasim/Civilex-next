-- ============================================================
-- Migration: 00023_fix_cases_select_lawyer_ambiguous_id.sql
-- ============================================================
-- Migration 00023: Fix cases_select_assigned_lawyer RLS policy
--
-- The subquery referenced `id` without qualification, which Postgres was
-- resolving to `case_assignments.id` (the assignment PK) instead of
-- `cases.id`. Result: the EXISTS always returned false, so lawyers saw
-- zero cases even when an assignment existed.

DROP POLICY IF EXISTS "cases_select_assigned_lawyer" ON public.cases;

CREATE POLICY "cases_select_assigned_lawyer" ON public.cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.case_assignments ca
      WHERE ca.case_id = cases.id
        AND ca.lawyer_id = auth.uid()
    )
  );



-- ============================================================
-- Migration: 00024_fix_cases_update_lawyer_policy.sql
-- ============================================================
-- Migration 00024: Consolidate cases_update_lawyer policies
--
-- Two problems:
--   1. Ambiguous `id` in the subquery resolved to case_assignments.id
--      instead of cases.id (same bug as 00023).
--   2. The accept flow updates the assignment to 'accepted' BEFORE updating
--      the case row. By the time the case UPDATE runs, no assignment with
--      status='pending' exists for this lawyer, so the USING clause of
--      cases_update_lawyer_pending fails â€” silently blocking the status
--      transition to 'payment_pending'.
--
-- Fix: one consolidated policy that allows UPDATE when the lawyer has
-- either a pending or accepted assignment on the case.

DROP POLICY IF EXISTS "cases_update_lawyer_pending" ON public.cases;
DROP POLICY IF EXISTS "cases_update_lawyer" ON public.cases;

CREATE POLICY "cases_update_lawyer" ON public.cases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.case_assignments ca
      WHERE ca.case_id = cases.id
        AND ca.lawyer_id = auth.uid()
        AND ca.status IN ('pending', 'accepted')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.case_assignments ca
      WHERE ca.case_id = cases.id
        AND ca.lawyer_id = auth.uid()
    )
  );



-- ============================================================
-- Migration: 00025_add_card_payment_method.sql
-- ============================================================
-- Migration 00025: Add 'card' to the payment_method enum so credit/debit
-- card simulated payments can be persisted.

ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'card';



-- ============================================================
-- Migration: 00026_hearing_transcripts.sql
-- ============================================================
-- Migration 00026: Hearing transcripts for stenographer workflow
--
-- Adds a verbatim transcript record per hearing, owned by a stenographer.
-- - proceedings_summary (existing) is the judge/court's short summary.
-- - hearing_transcripts (new) is the stenographer's verbatim record, which
--   can be signed/locked once finalised and then acts as the official record.
--
-- Also fixes a gap where stenographers had no application-level query filter
-- on cases (BUG-029): once a stenographer is assigned to a case
-- (cases.stenographer_id) the hook returns those cases.

-- Transcript status
CREATE TYPE public.transcript_status AS ENUM ('draft', 'signed');

-- Hearing transcripts
CREATE TABLE public.hearing_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID NOT NULL UNIQUE REFERENCES public.hearings(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  stenographer_id UUID REFERENCES public.profiles(id),
  transcript_text TEXT NOT NULL DEFAULT '',
  status public.transcript_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hearing_transcripts_case ON public.hearing_transcripts(case_id);
CREATE INDEX idx_hearing_transcripts_steno ON public.hearing_transcripts(stenographer_id);

CREATE TRIGGER hearing_transcripts_updated_at
  BEFORE UPDATE ON public.hearing_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.hearing_transcripts ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the case can read the transcript.
CREATE POLICY "hearing_transcripts_select" ON public.hearing_transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearing_transcripts.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Stenographers and court officials can create a transcript row.
-- The stenographer_id must be the caller, or a court official setting it up.
CREATE POLICY "hearing_transcripts_insert" ON public.hearing_transcripts
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('stenographer', 'trial_judge', 'admin_court', 'magistrate')
  );

-- Only the owning stenographer can edit the transcript, and only while draft.
-- Court officials (judge/admin) can also edit while draft (e.g. correction).
CREATE POLICY "hearing_transcripts_update" ON public.hearing_transcripts
  FOR UPDATE USING (
    status = 'draft'
    AND (
      stenographer_id = auth.uid()
      OR public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    )
  );

-- Allow court officials to assign a stenographer to a case.
-- (cases_update_court already covers this â€” no change needed. The column
-- exists on cases.stenographer_id from migration 00002.)

-- Notification type for transcript events (adds to existing check constraint
-- if present). We use the generic 'case_status_changed' type so no enum
-- change is required.



-- ============================================================
-- Migration: 00027_case_issues.sql
-- ============================================================
-- Migration 00027: Framing of Issues (CPC Order XIV)
--
-- After preliminary hearing the trial judge records the specific disputed
-- questions ("issues") the trial will resolve. Each issue is later answered
-- at judgment time with a finding (affirmative / negative / partly).
--
-- Design:
-- - issue_text is locked once the case moves past issues_framed.
-- - finding + finding_text are written at/after reserved_for_judgment.
-- - issue_number is scoped per-case (1..N). Uniqueness enforced by DB.

CREATE TYPE public.issue_type AS ENUM ('fact', 'law', 'mixed');
CREATE TYPE public.issue_finding AS ENUM ('affirmative', 'negative', 'partly', 'not_pressed');

CREATE TABLE public.case_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  issue_number INTEGER NOT NULL,
  issue_text TEXT NOT NULL,
  issue_type public.issue_type NOT NULL DEFAULT 'fact',
  burden_of_proof TEXT,
  finding public.issue_finding,
  finding_text TEXT,
  framed_by UUID REFERENCES public.profiles(id),
  framed_at TIMESTAMPTZ DEFAULT now(),
  decided_by UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (case_id, issue_number)
);

CREATE INDEX idx_case_issues_case ON public.case_issues(case_id);

CREATE TRIGGER case_issues_updated_at
  BEFORE UPDATE ON public.case_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.case_issues ENABLE ROW LEVEL SECURITY;

-- Any case party or court official can see the issues.
CREATE POLICY "case_issues_select" ON public.case_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_issues.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );

-- Only court officials can frame an issue, and only while the case is in
-- preliminary_hearing or issues_framed (so judge can still add/remove before
-- transferring to trial).
CREATE POLICY "case_issues_insert" ON public.case_issues
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_issues.case_id
      AND c.status IN ('preliminary_hearing', 'issues_framed')
    )
  );

-- Update rules:
--   - While case is still in preliminary_hearing or issues_framed: court
--     officials can fully edit issue text/type.
--   - Once case moved past those (evidence, arguments, reserved_for_judgment,
--     judgment_delivered): text is locked; only finding fields may be written
--     by court officials. We express the overall gate here; column-level
--     immutability is enforced by the hook (the only writer).
CREATE POLICY "case_issues_update" ON public.case_issues
  FOR UPDATE USING (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_issues.case_id
      AND c.status IN (
        'preliminary_hearing', 'issues_framed', 'transferred_to_trial',
        'evidence_stage', 'arguments', 'reserved_for_judgment',
        'judgment_delivered'
      )
    )
  );

-- Delete only allowed while still framing.
CREATE POLICY "case_issues_delete" ON public.case_issues
  FOR DELETE USING (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_issues.case_id
      AND c.status IN ('preliminary_hearing', 'issues_framed')
    )
  );



-- ============================================================
-- Migration: 00028_adjournments.sql
-- ============================================================
-- Migration 00028: Hearing adjournments
--
-- In Pakistani practice the reader/ahlmad (here: the stenographer, who
-- doubles as reader in our app) records why a hearing was adjourned, and
-- the judge may impose a cost. The transcript is verbatim; this is the
-- structured reason code for audit/reporting.

CREATE TYPE public.adjournment_reason AS ENUM (
  'party_absent',
  'counsel_unavailable',
  'document_pending',
  'court_busy',
  'judge_absent',
  'witness_absent',
  'other'
);

CREATE TABLE public.hearing_adjournments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID NOT NULL REFERENCES public.hearings(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  reason public.adjournment_reason NOT NULL,
  reason_text TEXT,
  cost_imposed NUMERIC(10, 2) DEFAULT 0,
  next_date TIMESTAMPTZ,
  adjourned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_adjournments_hearing ON public.hearing_adjournments(hearing_id);
CREATE INDEX idx_adjournments_case ON public.hearing_adjournments(case_id);

ALTER TABLE public.hearing_adjournments ENABLE ROW LEVEL SECURITY;

-- Any case party or court official can see adjournment reasons.
CREATE POLICY "hearing_adjournments_select" ON public.hearing_adjournments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearing_adjournments.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Court officials + assigned stenographer can record an adjournment.
CREATE POLICY "hearing_adjournments_insert" ON public.hearing_adjournments
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    OR (
      public.get_user_role() = 'stenographer'
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = hearing_adjournments.case_id
        AND c.stenographer_id = auth.uid()
      )
    )
  );



-- ============================================================
-- Migration: 00029_evidence_issue_links.sql
-- ============================================================
-- Migration 00029: Evidence â†” Issue linkage
--
-- Each piece of evidence may support (or refute) one or more framed issues.
-- This is the bridge between Order XIV (issues) and the evidence stage â€”
-- when the judge writes findings, they can see which evidence was tendered
-- against each issue.

CREATE TABLE public.evidence_issue_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence_records(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.case_issues(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  tagged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (evidence_id, issue_id)
);

CREATE INDEX idx_evidence_issue_links_evidence ON public.evidence_issue_links(evidence_id);
CREATE INDEX idx_evidence_issue_links_issue ON public.evidence_issue_links(issue_id);
CREATE INDEX idx_evidence_issue_links_case ON public.evidence_issue_links(case_id);

ALTER TABLE public.evidence_issue_links ENABLE ROW LEVEL SECURITY;

-- Any party to the case or a court official can see the links.
CREATE POLICY "evidence_issue_links_select" ON public.evidence_issue_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = evidence_issue_links.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Lawyers on the case and court officials can tag evidence to issues.
-- Either side's counsel tags their own evidence; the judge may retag.
CREATE POLICY "evidence_issue_links_insert" ON public.evidence_issue_links
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    OR (
      public.get_user_role() = 'lawyer'
      AND EXISTS (
        SELECT 1 FROM public.case_assignments ca
        WHERE ca.case_id = evidence_issue_links.case_id
          AND ca.lawyer_id = auth.uid()
          AND ca.status = 'accepted'
      )
    )
  );

-- Same set can remove tags.
CREATE POLICY "evidence_issue_links_delete" ON public.evidence_issue_links
  FOR DELETE USING (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    OR (
      public.get_user_role() = 'lawyer'
      AND EXISTS (
        SELECT 1 FROM public.case_assignments ca
        WHERE ca.case_id = evidence_issue_links.case_id
          AND ca.lawyer_id = auth.uid()
          AND ca.status = 'accepted'
      )
    )
  );



-- ============================================================
-- Migration: 00030_decrees.sql
-- ============================================================
-- Migration 00030: Decrees (CPC Order XX)
--
-- After a judgment is delivered the court must draw up a formal decree â€”
-- the enforceable instrument that names the decree-holder (the winning
-- party) and the judgment-debtor (the losing party), records the operative
-- relief, costs, and any time granted for compliance. The decree is what
-- the decree-holder executes when the judgment-debtor does not comply.

CREATE TYPE public.decree_type AS ENUM (
  'money',          -- Payment of a sum of money
  'possession',     -- Delivery of movable/immovable property
  'injunction',     -- Mandatory/prohibitory injunction
  'declaration',    -- Declaratory decree (no further action)
  'specific_performance',
  'partition',
  'dismissal',      -- Suit dismissed
  'compromise',     -- Recorded settlement
  'other'
);

CREATE TYPE public.decree_status AS ENUM (
  'drafted',
  'signed',
  'executed',
  'satisfied',
  'pending_execution'
);

CREATE TABLE public.decrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  judgment_id UUID REFERENCES public.judgment_records(id) ON DELETE SET NULL,
  decree_number TEXT,
  decree_type public.decree_type NOT NULL,
  status public.decree_status NOT NULL DEFAULT 'drafted',
  -- Parties (copied from case at decree time so wording remains stable)
  decree_holder_id UUID REFERENCES public.profiles(id),
  judgment_debtor_id UUID REFERENCES public.profiles(id),
  -- Operative content
  operative_text TEXT NOT NULL,
  relief_granted TEXT,
  amount_awarded NUMERIC(14, 2),
  costs_awarded NUMERIC(14, 2),
  interest_terms TEXT,
  compliance_period_days INTEGER,
  -- Audit
  drawn_up_by UUID REFERENCES public.profiles(id),
  drawn_up_at TIMESTAMPTZ DEFAULT now(),
  signed_by UUID REFERENCES public.profiles(id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_decrees_case ON public.decrees(case_id);
CREATE INDEX idx_decrees_judgment ON public.decrees(judgment_id);
CREATE INDEX idx_decrees_status ON public.decrees(status);
CREATE UNIQUE INDEX idx_decrees_one_per_case ON public.decrees(case_id);

ALTER TABLE public.decrees ENABLE ROW LEVEL SECURITY;

-- Parties to the case and court officials can read the decree.
CREATE POLICY "decrees_select" ON public.decrees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = decrees.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Only the presiding judge / magistrate / admin_court may draw up a decree,
-- and only once a judgment has been delivered on the case.
CREATE POLICY "decrees_insert" ON public.decrees
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = decrees.case_id
      AND c.status IN ('judgment_delivered', 'closed', 'disposed')
    )
  );

-- Court officials may update the decree until it is signed; after signing
-- the status can still advance (executed/satisfied) but operative text is
-- frozen by application logic.
CREATE POLICY "decrees_update" ON public.decrees
  FOR UPDATE USING (
    public.get_user_role() IN ('trial_judge', 'admin_court', 'magistrate')
  );



-- ============================================================
-- Migration: 00031_appeals.sql
-- ============================================================
-- Migration 00031: Appeals (CPC Section 96, Order XLI)
--
-- Any party aggrieved by a decree may prefer an appeal to the court
-- authorised to hear appeals from the decisions of the deciding court.
-- The aggrieved party (the appellant) files a memorandum of appeal within
-- the limitation period (30 days to District Court, 90 days to High Court
-- under the Limitation Act 1908). The respondent is the other party.
-- This table records the appeal filing; the appellate proceedings proper
-- live on the new case row that the registrar opens from it.

CREATE TYPE public.appeal_forum AS ENUM (
  'district_court',   -- First appeal from subordinate civil court
  'high_court',       -- First/second appeal lies to High Court
  'supreme_court'     -- Appeal from High Court judgments
);

CREATE TYPE public.appeal_side AS ENUM (
  'plaintiff',        -- Original plaintiff is appealing (lost or partially lost)
  'defendant'         -- Original defendant is appealing
);

CREATE TYPE public.appeal_status AS ENUM (
  'filed',            -- Memorandum filed, awaiting admission
  'admitted',         -- Court admitted the appeal and issued notice
  'rejected',         -- Summarily rejected under Order XLI Rule 11
  'dismissed',        -- Dismissed after hearing (appeal fails)
  'allowed',          -- Appeal succeeds, decree set aside/modified
  'withdrawn',        -- Appellant withdrew
  'time_barred'       -- Rejected for being filed beyond limitation
);

CREATE TABLE public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  decree_id UUID REFERENCES public.decrees(id) ON DELETE SET NULL,
  judgment_id UUID REFERENCES public.judgment_records(id) ON DELETE SET NULL,

  appeal_number TEXT,
  appellate_forum public.appeal_forum NOT NULL,
  appellant_side public.appeal_side NOT NULL,

  -- Parties for the appeal (usually mirror the case, but recorded here so
  -- later profile changes do not rewrite history)
  appellant_id UUID NOT NULL REFERENCES public.profiles(id),
  respondent_id UUID REFERENCES public.profiles(id),

  -- Limitation tracking
  judgment_date DATE NOT NULL,          -- Date the impugned judgment was delivered
  limitation_days INTEGER NOT NULL,     -- 30 / 90 / as applicable
  filed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  is_time_barred BOOLEAN GENERATED ALWAYS AS (
    (filed_on - judgment_date) > limitation_days
  ) STORED,
  condonation_requested BOOLEAN NOT NULL DEFAULT false,
  condonation_reason TEXT,

  -- Memorandum of appeal
  grounds_of_appeal TEXT NOT NULL,      -- Numbered grounds under Order XLI Rule 1
  relief_sought TEXT NOT NULL,

  -- Lifecycle
  status public.appeal_status NOT NULL DEFAULT 'filed',
  admitted_at TIMESTAMPTZ,
  admitted_by UUID REFERENCES public.profiles(id),
  disposal_date TIMESTAMPTZ,
  disposal_reason TEXT,

  -- Audit
  filed_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appeals_case ON public.appeals(case_id);
CREATE INDEX idx_appeals_decree ON public.appeals(decree_id);
CREATE INDEX idx_appeals_status ON public.appeals(status);
CREATE INDEX idx_appeals_appellant ON public.appeals(appellant_id);

CREATE TRIGGER appeals_updated_at
  BEFORE UPDATE ON public.appeals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Parties to the underlying case and court officials can view appeals.
CREATE POLICY "appeals_select" ON public.appeals
  FOR SELECT USING (
    appellant_id = auth.uid()
    OR respondent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = appeals.case_id
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- An appeal may be filed by the aggrieved party themselves (a client who was
-- plaintiff or defendant on the case) or by their engaged lawyer.
-- The underlying case must have a delivered judgment.
CREATE POLICY "appeals_insert" ON public.appeals
  FOR INSERT WITH CHECK (
    filed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = appeals.case_id
      AND c.status IN ('judgment_delivered', 'closed', 'disposed')
      AND (
        c.plaintiff_id = auth.uid()
        OR c.defendant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id
            AND ca.lawyer_id = auth.uid()
            AND ca.status = 'accepted'
        )
      )
    )
  );

-- Appellants may edit the memorandum while it is still in 'filed' state
-- (i.e., before the appellate court has admitted it).
CREATE POLICY "appeals_update_appellant" ON public.appeals
  FOR UPDATE USING (
    appellant_id = auth.uid()
    AND status = 'filed'
  );

-- Court officials can advance status (admit / reject / dispose).
CREATE POLICY "appeals_update_court" ON public.appeals
  FOR UPDATE USING (
    public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );



-- ============================================================
-- Migration: 00032_execution_applications.sql
-- ============================================================
-- Migration 00032: Execution of Decree (CPC Order XXI)
--
-- Once a decree is drawn up and signed, the decree-holder may apply to the
-- court for execution if the judgment-debtor does not comply within the
-- compliance period. Order XXI governs the modes of execution: attachment
-- and sale of property (movable or immovable), delivery of possession,
-- arrest and detention of the judgment-debtor, appointment of a receiver,
-- or any other mode the court directs. The court issues warrants and
-- ultimately records satisfaction when the decree is fully executed.

CREATE TYPE public.execution_mode AS ENUM (
  'attachment_movable',     -- Order XXI Rule 43 â€” attachment of movable property
  'attachment_immovable',   -- Order XXI Rule 54 â€” attachment of immovable property
  'sale_movable',           -- Order XXI Rule 64-78 â€” sale after attachment
  'sale_immovable',         -- Order XXI Rule 82-94 â€” sale of immovable
  'delivery_possession',    -- Order XXI Rule 35-36 â€” delivery of property
  'arrest_detention',       -- Order XXI Rule 37-40 â€” civil prison
  'appoint_receiver',       -- Order XL â€” receiver appointed for execution
  'payment_into_court',     -- Direct payment of decretal amount
  'other'
);

CREATE TYPE public.execution_status AS ENUM (
  'filed',              -- Execution application filed by decree-holder
  'notice_issued',      -- Show-cause notice issued to judgment-debtor (Rule 22)
  'attachment_ordered', -- Court ordered attachment
  'property_attached',  -- Attachment effected by bailiff
  'sale_ordered',       -- Sale proclamation issued
  'warrant_issued',     -- Arrest or delivery warrant issued
  'satisfied',          -- Decree fully satisfied (Rule 2)
  'partially_satisfied',
  'struck_off',         -- Application struck off for default
  'dismissed'           -- Dismissed on merits
);

CREATE TABLE public.execution_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  decree_id UUID NOT NULL REFERENCES public.decrees(id) ON DELETE CASCADE,

  execution_number TEXT,
  execution_mode public.execution_mode NOT NULL,
  status public.execution_status NOT NULL DEFAULT 'filed',

  -- Parties (mirror decree at filing time)
  decree_holder_id UUID NOT NULL REFERENCES public.profiles(id),
  judgment_debtor_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Amount / property being recovered
  decretal_amount NUMERIC(14, 2),
  amount_recovered NUMERIC(14, 2) DEFAULT 0,
  property_description TEXT,       -- For attachment / delivery modes
  property_location TEXT,

  -- Application content
  grounds TEXT NOT NULL,           -- Why execution is sought
  relief_sought TEXT NOT NULL,     -- Specific prayer

  -- Lifecycle
  filed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notice_issued_at TIMESTAMPTZ,
  attachment_ordered_at TIMESTAMPTZ,
  satisfied_at TIMESTAMPTZ,
  satisfaction_note TEXT,          -- Rule 2 recording of satisfaction

  -- Audit
  filed_by UUID NOT NULL REFERENCES public.profiles(id),
  presiding_officer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_execution_case ON public.execution_applications(case_id);
CREATE INDEX idx_execution_decree ON public.execution_applications(decree_id);
CREATE INDEX idx_execution_status ON public.execution_applications(status);
CREATE INDEX idx_execution_holder ON public.execution_applications(decree_holder_id);

CREATE TRIGGER execution_applications_updated_at
  BEFORE UPDATE ON public.execution_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Warrants issued during execution (attachment, arrest, delivery, sale).
-- Each warrant has a bailiff assigned and a return filed after service.
CREATE TYPE public.warrant_type AS ENUM (
  'attachment',
  'arrest',
  'delivery',
  'sale_proclamation'
);

CREATE TYPE public.warrant_status AS ENUM (
  'issued',
  'served',
  'returned_executed',
  'returned_unexecuted',
  'recalled'
);

CREATE TABLE public.execution_warrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.execution_applications(id) ON DELETE CASCADE,

  warrant_number TEXT,
  warrant_type public.warrant_type NOT NULL,
  status public.warrant_status NOT NULL DEFAULT 'issued',

  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  returnable_by DATE,
  bailiff_name TEXT,                -- Free-text; bailiffs are not first-class users
  directions TEXT NOT NULL,         -- What the warrant authorises

  served_on DATE,
  return_note TEXT,                 -- Bailiff's report of execution

  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_warrants_execution ON public.execution_warrants(execution_id);
CREATE INDEX idx_warrants_status ON public.execution_warrants(status);

CREATE TRIGGER execution_warrants_updated_at
  BEFORE UPDATE ON public.execution_warrants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS: execution_applications
ALTER TABLE public.execution_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_select" ON public.execution_applications
  FOR SELECT USING (
    decree_holder_id = auth.uid()
    OR judgment_debtor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = execution_applications.case_id
      AND (
        c.admin_court_id = auth.uid()
        OR c.trial_judge_id = auth.uid()
        OR c.stenographer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = c.id AND ca.lawyer_id = auth.uid()
        )
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Only the decree-holder (or their engaged lawyer) may file an execution
-- application, and only on a signed/executed decree.
CREATE POLICY "execution_insert" ON public.execution_applications
  FOR INSERT WITH CHECK (
    filed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.decrees d
      WHERE d.id = execution_applications.decree_id
      AND d.status IN ('signed', 'executed', 'pending_execution')
      AND (
        d.decree_holder_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.case_assignments ca
          WHERE ca.case_id = d.case_id
            AND ca.lawyer_id = auth.uid()
            AND ca.status = 'accepted'
        )
      )
    )
  );

-- Decree-holder may edit the application while still 'filed'.
CREATE POLICY "execution_update_holder" ON public.execution_applications
  FOR UPDATE USING (
    decree_holder_id = auth.uid()
    AND status = 'filed'
  );

-- Court officials advance status, issue notices, order attachment, etc.
CREATE POLICY "execution_update_court" ON public.execution_applications
  FOR UPDATE USING (
    public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );

-- RLS: execution_warrants
ALTER TABLE public.execution_warrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warrants_select" ON public.execution_warrants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.execution_applications e
      WHERE e.id = execution_warrants.execution_id
      AND (
        e.decree_holder_id = auth.uid()
        OR e.judgment_debtor_id = auth.uid()
      )
    )
    OR public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate', 'stenographer')
  );

-- Only court officials issue warrants.
CREATE POLICY "warrants_insert" ON public.execution_warrants
  FOR INSERT WITH CHECK (
    issued_by = auth.uid()
    AND public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );

CREATE POLICY "warrants_update" ON public.execution_warrants
  FOR UPDATE USING (
    public.get_user_role() IN ('admin_court', 'trial_judge', 'magistrate')
  );



-- ============================================================
-- Migration: 00033_judicial_workflow_enhancements.sql
-- ============================================================
-- ============================================================
-- Migration 00033: Judicial Workflow Enhancements
-- Adds:
--   1. relief_sought column on cases (petition detail)
--   2. hearing_id FK on evidence_records (per-hearing admission)
--   3. New hearing type values for the full judicial lifecycle
--   4. written_statements table (defendant's formal reply)
--   5. hearing_attendance table (per-hearing roster)
-- ============================================================

-- â”€â”€ 1. Petition: relief sought â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS relief_sought TEXT;

-- â”€â”€ 2. Evidence: link to the hearing it was admitted at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.evidence_records
  ADD COLUMN IF NOT EXISTS hearing_id UUID REFERENCES public.hearings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_hearing ON public.evidence_records(hearing_id);

-- â”€â”€ 3. Hearing type enum: add judicial workflow types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PostgreSQL requires ADD VALUE outside a transaction block; use the
-- IF NOT EXISTS guard so re-running the migration is safe.
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'framing_of_issues';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'evidence_recording';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'cross_examination';
ALTER TYPE public.hearing_type ADD VALUE IF NOT EXISTS 'final_arguments';

-- â”€â”€ 4. Written Statements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ 5. Hearing Attendance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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



