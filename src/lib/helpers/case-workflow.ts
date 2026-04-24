/**
 * case-workflow.ts
 *
 * Valid status transitions for the Civilex case lifecycle.
 * Use this map to validate that a requested transition is legal
 * before making DB updates.
 */

import type { CaseStatus, Role } from "@/lib/constants";
import { CASE_STATUS } from "@/lib/constants";

/** Map of every status to the statuses it may transition TO. */
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  // ── Pre-registration ────────────────────────────────────────────────
  draft: [CASE_STATUS.PENDING_LAWYER_ACCEPTANCE, CASE_STATUS.WITHDRAWN],
  pending_lawyer_acceptance: [
    CASE_STATUS.PAYMENT_PENDING,         // lawyer accepted
    CASE_STATUS.DRAFT,                   // lawyer declined → revert
    CASE_STATUS.WITHDRAWN,               // client withdraws
  ],
  lawyer_accepted: [CASE_STATUS.PAYMENT_PENDING, CASE_STATUS.WITHDRAWN],
  payment_pending: [CASE_STATUS.PAYMENT_CONFIRMED, CASE_STATUS.WITHDRAWN],
  payment_confirmed: [CASE_STATUS.DRAFTING, CASE_STATUS.WITHDRAWN],
  drafting: [CASE_STATUS.SUBMITTED_TO_ADMIN, CASE_STATUS.WITHDRAWN],
  submitted_to_admin: [CASE_STATUS.UNDER_SCRUTINY, CASE_STATUS.RETURNED_FOR_REVISION, CASE_STATUS.WITHDRAWN],
  under_scrutiny: [CASE_STATUS.REGISTERED, CASE_STATUS.RETURNED_FOR_REVISION, CASE_STATUS.WITHDRAWN],
  returned_for_revision: [CASE_STATUS.DRAFTING, CASE_STATUS.WITHDRAWN],

  // ── Admin Court ──────────────────────────────────────────────────────
  registered: [CASE_STATUS.SUMMON_ISSUED, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  summon_issued: [CASE_STATUS.PRELIMINARY_HEARING, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  preliminary_hearing: [CASE_STATUS.ISSUES_FRAMED, CASE_STATUS.DISPOSED, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  issues_framed: [CASE_STATUS.TRANSFERRED_TO_TRIAL, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],

  // ── Stay order: can be lifted and resume ────────────────────────────
  stayed: [CASE_STATUS.REGISTERED],     // stay lifted → back to registered

  // ── Trial Court ──────────────────────────────────────────────────────
  transferred_to_trial: [CASE_STATUS.EVIDENCE_STAGE, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  evidence_stage: [CASE_STATUS.ARGUMENTS, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  arguments: [CASE_STATUS.RESERVED_FOR_JUDGMENT, CASE_STATUS.STAYED, CASE_STATUS.WITHDRAWN],
  reserved_for_judgment: [CASE_STATUS.JUDGMENT_DELIVERED],

  // ── Post-judgment ────────────────────────────────────────────────────
  judgment_delivered: [
    CASE_STATUS.CLOSED,
    CASE_STATUS.UNDER_EXECUTION,         // decree enforcement starts
    CASE_STATUS.REMANDED,                // appellate court sends back for retrial
  ],
  under_execution: [CASE_STATUS.SATISFIED], // decree fully executed
  satisfied: [],                         // terminal
  remanded: [CASE_STATUS.TRANSFERRED_TO_TRIAL], // retrial starts at trial court
  closed: [CASE_STATUS.APPEAL_FILED],    // party files appeal
  appeal_filed: [],                      // terminal (handled by appeal records table)

  // ── Terminal states ──────────────────────────────────────────────────
  disposed: [],
  withdrawn: [],
};

/**
 * Returns true if `from → to` is a permitted transition.
 */
export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Returns the list of statuses that the given role is allowed to transition
 * a case INTO (regardless of current status).
 */
export const ROLE_ALLOWED_TRANSITIONS: Record<Role, CaseStatus[]> = {
  client: [
    CASE_STATUS.PENDING_LAWYER_ACCEPTANCE, // submit to lawyer
    CASE_STATUS.SUBMITTED_TO_ADMIN,        // submit to admin after drafting
    CASE_STATUS.DRAFTING,                  // revert after revision
    CASE_STATUS.WITHDRAWN,                 // withdraw own case
    CASE_STATUS.APPEAL_FILED,             // file appeal after closure
  ],
  lawyer: [
    CASE_STATUS.PAYMENT_PENDING,           // accept case
    CASE_STATUS.DRAFT,                     // decline (revert)
    CASE_STATUS.WITHDRAWN,                 // withdraw on behalf of client
    CASE_STATUS.APPEAL_FILED,             // file appeal on behalf of client
  ],
  admin_court: [
    CASE_STATUS.UNDER_SCRUTINY,
    CASE_STATUS.REGISTERED,
    CASE_STATUS.RETURNED_FOR_REVISION,
    CASE_STATUS.SUMMON_ISSUED,
    CASE_STATUS.PRELIMINARY_HEARING,
    CASE_STATUS.ISSUES_FRAMED,
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.STAYED,
    CASE_STATUS.DISPOSED,
    CASE_STATUS.WITHDRAWN,
    CASE_STATUS.UNDER_EXECUTION,
    CASE_STATUS.SATISFIED,
    CASE_STATUS.REMANDED,
  ],
  magistrate: [
    CASE_STATUS.UNDER_SCRUTINY,
    CASE_STATUS.REGISTERED,
    CASE_STATUS.RETURNED_FOR_REVISION,
    CASE_STATUS.SUMMON_ISSUED,
    CASE_STATUS.PRELIMINARY_HEARING,
    CASE_STATUS.ISSUES_FRAMED,
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.STAYED,
    CASE_STATUS.DISPOSED,
    CASE_STATUS.WITHDRAWN,
  ],
  trial_judge: [
    CASE_STATUS.REGISTERED,               // lift a stay order (stayed → registered)
    CASE_STATUS.TRANSFERRED_TO_TRIAL,     // resume after remand
    CASE_STATUS.EVIDENCE_STAGE,
    CASE_STATUS.ARGUMENTS,
    CASE_STATUS.RESERVED_FOR_JUDGMENT,
    CASE_STATUS.JUDGMENT_DELIVERED,
    CASE_STATUS.UNDER_EXECUTION,
    CASE_STATUS.SATISFIED,
    CASE_STATUS.REMANDED,
    CASE_STATUS.CLOSED,
    CASE_STATUS.STAYED,
    CASE_STATUS.DISPOSED,
  ],
  stenographer: [], // read-only; no status transitions
};

/**
 * Returns true if the given role is allowed to trigger a specific transition.
 */
export function canRoleTransitionTo(role: Role, to: CaseStatus): boolean {
  return (ROLE_ALLOWED_TRANSITIONS[role] ?? []).includes(to);
}

/**
 * Returns the next logical status(es) for the case given the current status
 * and the acting user's role.
 */
export function getNextStatuses(
  currentStatus: CaseStatus,
  role: Role
): CaseStatus[] {
  const possibleNext = VALID_TRANSITIONS[currentStatus] ?? [];
  const roleAllowed = ROLE_ALLOWED_TRANSITIONS[role] ?? [];
  return possibleNext.filter((s) => roleAllowed.includes(s));
}

/**
 * Phase groupings — useful for gating UI sections.
 */
export const CASE_PHASES = {
  filing: [
    CASE_STATUS.DRAFT,
    CASE_STATUS.PENDING_LAWYER_ACCEPTANCE,
    CASE_STATUS.LAWYER_ACCEPTED,
    CASE_STATUS.PAYMENT_PENDING,
    CASE_STATUS.PAYMENT_CONFIRMED,
    CASE_STATUS.DRAFTING,
    CASE_STATUS.SUBMITTED_TO_ADMIN,
    CASE_STATUS.RETURNED_FOR_REVISION,
  ],
  admin_court: [
    CASE_STATUS.UNDER_SCRUTINY,
    CASE_STATUS.REGISTERED,
    CASE_STATUS.SUMMON_ISSUED,
    CASE_STATUS.PRELIMINARY_HEARING,
    CASE_STATUS.ISSUES_FRAMED,
    CASE_STATUS.STAYED,
  ],
  trial_court: [
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.EVIDENCE_STAGE,
    CASE_STATUS.ARGUMENTS,
    CASE_STATUS.RESERVED_FOR_JUDGMENT,
    CASE_STATUS.REMANDED,
  ],
  concluded: [
    CASE_STATUS.JUDGMENT_DELIVERED,
    CASE_STATUS.UNDER_EXECUTION,
    CASE_STATUS.SATISFIED,
    CASE_STATUS.APPEAL_FILED,
    CASE_STATUS.CLOSED,
    CASE_STATUS.DISPOSED,
    CASE_STATUS.WITHDRAWN,
  ],
} as const;

export type CasePhase = keyof typeof CASE_PHASES;

/** Returns which phase the current status belongs to. */
export function getCasePhase(status: CaseStatus): CasePhase | null {
  for (const [phase, statuses] of Object.entries(CASE_PHASES)) {
    if ((statuses as readonly CaseStatus[]).includes(status)) {
      return phase as CasePhase;
    }
  }
  return null;
}

/** Returns true if a case has reached the trial court phase. */
export function isTrialPhase(status: CaseStatus): boolean {
  return getCasePhase(status) === "trial_court";
}

/** Returns true if a case is concluded (no further transitions possible). */
export function isConcluded(status: CaseStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}
