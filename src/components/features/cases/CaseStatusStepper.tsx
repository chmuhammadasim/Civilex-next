"use client";

import { CASE_STATUS, CASE_STATUS_LABELS, type CaseStatus } from "@/lib/constants";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";

/** Ordered steps of the case lifecycle */
const STATUS_STEPS: CaseStatus[] = [
  CASE_STATUS.DRAFT,
  CASE_STATUS.PENDING_LAWYER_ACCEPTANCE,
  CASE_STATUS.PAYMENT_PENDING,
  CASE_STATUS.PAYMENT_CONFIRMED,
  CASE_STATUS.DRAFTING,
  CASE_STATUS.SUBMITTED_TO_ADMIN,
  CASE_STATUS.UNDER_SCRUTINY,
  CASE_STATUS.REGISTERED,
  CASE_STATUS.SUMMON_ISSUED,
  CASE_STATUS.PRELIMINARY_HEARING,
  CASE_STATUS.ISSUES_FRAMED,
  CASE_STATUS.TRANSFERRED_TO_TRIAL,
  CASE_STATUS.EVIDENCE_STAGE,
  CASE_STATUS.ARGUMENTS,
  CASE_STATUS.RESERVED_FOR_JUDGMENT,
  CASE_STATUS.JUDGMENT_DELIVERED,
  CASE_STATUS.CLOSED,
];

/** Statuses that indicate a problem / deviation */
const PROBLEM_STATUSES: CaseStatus[] = [
  CASE_STATUS.RETURNED_FOR_REVISION,
  CASE_STATUS.DISPOSED,
];

interface CaseStatusStepperProps {
  currentStatus: CaseStatus;
  /** Show a compact horizontal mini-stepper. Default: false (vertical). */
  compact?: boolean;
  className?: string;
}

export default function CaseStatusStepper({
  currentStatus,
  compact = false,
  className = "",
}: CaseStatusStepperProps) {
  const isProblem = PROBLEM_STATUSES.includes(currentStatus);

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  if (compact) {
    return <CompactStepper currentStatus={currentStatus} currentIndex={currentIndex} isProblem={isProblem} className={className} />;
  }

  return (
    <div className={["space-y-0", className].join(" ")}>
      {STATUS_STEPS.map((status, i) => {
        const isCompleted = currentIndex > i;
        const isCurrent = currentIndex === i;
        const isLast = i === STATUS_STEPS.length - 1;

        return (
          <div key={status} className="flex gap-3">
            {/* Connector + icon column */}
            <div className="flex flex-col items-center">
              <StepIcon
                completed={isCompleted}
                current={isCurrent}
                problem={isCurrent && isProblem}
              />
              {!isLast && (
                <div
                  className={[
                    "w-0.5 grow",
                    isCompleted ? "bg-success" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>

            {/* Label */}
            <div className="pb-5 pt-0.5">
              <p
                className={[
                  "text-sm leading-snug",
                  isCurrent && !isProblem
                    ? "font-semibold text-primary"
                    : isCurrent && isProblem
                    ? "font-semibold text-warning"
                    : isCompleted
                    ? "font-medium text-success"
                    : "text-muted",
                ].join(" ")}
              >
                {CASE_STATUS_LABELS[status]}
              </p>
              {isCurrent && (
                <span
                  className={[
                    "mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    isProblem
                      ? "bg-warning/10 text-warning"
                      : "bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  Current
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Show deviation status below the main flow if applicable */}
      {isProblem && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-warning bg-warning/5 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-warning">
            {CASE_STATUS_LABELS[currentStatus]}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Compact horizontal mini-stepper ── */
function CompactStepper({
  currentStatus,
  currentIndex,
  isProblem,
  className,
}: {
  currentStatus: CaseStatus;
  currentIndex: number;
  isProblem: boolean;
  className: string;
}) {
  // Show 5 steps: 2 before, current, 2 after (clamped)
  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(STATUS_STEPS.length - 1, start + 4);
  const visible = STATUS_STEPS.slice(start, end + 1);

  return (
    <div className={["flex items-center gap-1 overflow-x-auto", className].join(" ")}>
      {start > 0 && <span className="text-muted text-xs">…</span>}
      {visible.map((status, vi) => {
        const i = start + vi;
        const isCompleted = currentIndex > i;
        const isCurrent = currentIndex === i;

        return (
          <div key={status} className="flex items-center gap-1">
            <div
              title={CASE_STATUS_LABELS[status]}
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                isCompleted
                  ? "bg-success text-white"
                  : isCurrent
                  ? isProblem
                    ? "bg-warning text-white"
                    : "bg-primary text-white"
                  : "bg-border text-muted",
              ].join(" ")}
            >
              {isCompleted ? "✓" : i + 1}
            </div>
            {vi < visible.length - 1 && (
              <div
                className={["h-0.5 w-4 rounded-full", isCompleted ? "bg-success" : "bg-border"].join(" ")}
              />
            )}
          </div>
        );
      })}
      {end < STATUS_STEPS.length - 1 && <span className="text-muted text-xs">…</span>}

      {/* Current label */}
      <span
        className={[
          "ml-2 shrink-0 text-xs font-medium",
          isProblem ? "text-warning" : "text-primary",
        ].join(" ")}
      >
        {CASE_STATUS_LABELS[currentStatus]}
      </span>
    </div>
  );
}

/* ── Step icon ── */
function StepIcon({
  completed,
  current,
  problem,
}: {
  completed: boolean;
  current: boolean;
  problem: boolean;
}) {
  if (completed) {
    return <CheckCircle className="h-5 w-5 shrink-0 text-success" />;
  }
  if (current && problem) {
    return <AlertCircle className="h-5 w-5 shrink-0 text-warning" />;
  }
  if (current) {
    return <Clock className="h-5 w-5 shrink-0 text-primary" />;
  }
  return <Circle className="h-5 w-5 shrink-0 text-border" />;
}
