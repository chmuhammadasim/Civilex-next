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
  draft: [CASE_STATUS.PENDING_LAWYER_ACCEPTANCE],
  pending_lawyer_acceptance: [
    CASE_STATUS.PAYMENT_PENDING,   // lawyer accepted
    CASE_STATUS.DRAFT,             // lawyer declined → revert
  ],
  lawyer_accepted: [CASE_STATUS.PAYMENT_PENDING],
  payment_pending: [CASE_STATUS.PAYMENT_CONFIRMED],
  payment_confirmed: [CASE_STATUS.DRAFTING],
  drafting: [CASE_STATUS.SUBMITTED_TO_ADMIN],
  submitted_to_admin: [CASE_STATUS.UNDER_SCRUTINY, CASE_STATUS.RETURNED_FOR_REVISION],
  under_scrutiny: [CASE_STATUS.REGISTERED, CASE_STATUS.RETURNED_FOR_REVISION],
  returned_for_revision: [CASE_STATUS.DRAFTING],
  registered: [CASE_STATUS.SUMMON_ISSUED],
  summon_issued: [CASE_STATUS.PRELIMINARY_HEARING],
  preliminary_hearing: [CASE_STATUS.ISSUES_FRAMED, CASE_STATUS.DISPOSED],
  issues_framed: [CASE_STATUS.TRANSFERRED_TO_TRIAL],
  transferred_to_trial: [CASE_STATUS.EVIDENCE_STAGE],
  evidence_stage: [CASE_STATUS.ARGUMENTS],
  arguments: [CASE_STATUS.RESERVED_FOR_JUDGMENT],
  reserved_for_judgment: [CASE_STATUS.JUDGMENT_DELIVERED],
  judgment_delivered: [CASE_STATUS.CLOSED],
  closed: [],
  disposed: [],
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
  ],
  lawyer: [
    CASE_STATUS.PAYMENT_PENDING,           // accept case
    CASE_STATUS.DRAFT,                     // decline (revert)
  ],
  admin_court: [
    CASE_STATUS.UNDER_SCRUTINY,
    CASE_STATUS.REGISTERED,
    CASE_STATUS.RETURNED_FOR_REVISION,
    CASE_STATUS.SUMMON_ISSUED,
    CASE_STATUS.PRELIMINARY_HEARING,
    CASE_STATUS.ISSUES_FRAMED,
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.DISPOSED,
  ],
  magistrate: [
    CASE_STATUS.UNDER_SCRUTINY,
    CASE_STATUS.REGISTERED,
    CASE_STATUS.RETURNED_FOR_REVISION,
    CASE_STATUS.SUMMON_ISSUED,
    CASE_STATUS.PRELIMINARY_HEARING,
    CASE_STATUS.ISSUES_FRAMED,
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.DISPOSED,
  ],
  trial_judge: [
    CASE_STATUS.EVIDENCE_STAGE,
    CASE_STATUS.ARGUMENTS,
    CASE_STATUS.RESERVED_FOR_JUDGMENT,
    CASE_STATUS.JUDGMENT_DELIVERED,
    CASE_STATUS.CLOSED,
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
  ],
  trial_court: [
    CASE_STATUS.TRANSFERRED_TO_TRIAL,
    CASE_STATUS.EVIDENCE_STAGE,
    CASE_STATUS.ARGUMENTS,
    CASE_STATUS.RESERVED_FOR_JUDGMENT,
  ],
  concluded: [
    CASE_STATUS.JUDGMENT_DELIVERED,
    CASE_STATUS.CLOSED,
    CASE_STATUS.DISPOSED,
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
