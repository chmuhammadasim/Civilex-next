"use client";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Payment } from "@/types/payment";
import { CheckCircle, Clock, AlertCircle, CalendarDays } from "lucide-react";

/* ── Props ─────────────────────────────────────────────────────────── */
interface InstallmentPlanProps {
  /** All payment rows that belong to this installment plan (is_installment === true). */
  payments: Payment[];
  /** Optional: show a summary header with total fee and completion percentage. */
  showSummary?: boolean;
}

/* ── Helpers ───────────────────────────────────────────────────────── */
const statusConfig = {
  completed: {
    label: "Paid",
    variant: "success" as const,
    Icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    variant: "info" as const,
    Icon: Clock,
  },
  pending: {
    label: "Pending",
    variant: "warning" as const,
    Icon: Clock,
  },
  failed: {
    label: "Failed",
    variant: "danger" as const,
    Icon: AlertCircle,
  },
  refunded: {
    label: "Refunded",
    variant: "default" as const,
    Icon: AlertCircle,
  },
};

/* ── Component ─────────────────────────────────────────────────────── */
export default function InstallmentPlan({
  payments,
  showSummary = true,
}: InstallmentPlanProps) {
  if (payments.length === 0) return null;

  /* Sort by installment number for consistent display */
  const sorted = [...payments].sort(
    (a, b) => a.installment_number - b.installment_number
  );

  const total = sorted.reduce((sum, p) => sum + p.amount, 0);
  const paid = sorted
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount = sorted.filter((p) => p.status === "completed").length;
  const completionPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const totalCount = sorted[0]?.total_installments ?? sorted.length;

  return (
    <Card padding="md">
      {/* ── Summary header ───────────────────────────────────────── */}
      {showSummary && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Installment Plan
              <span className="ml-2 text-xs font-normal text-muted">
                {totalCount} instalments
              </span>
            </h3>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(paid)}{" "}
              <span className="text-xs font-normal text-muted">
                / {formatCurrency(total)}
              </span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={
                { "--bar-w": `${completionPct}%`, width: "var(--bar-w)" } as React.CSSProperties
              }
            />
          </div>

          <p className="text-xs text-muted">
            {paidCount} of {totalCount} paid · {completionPct}% complete
          </p>
        </div>
      )}

      {/* ── Installment rows ─────────────────────────────────────── */}
      <div className="space-y-2">
        {sorted.map((payment) => {
          const cfg = statusConfig[payment.status] ?? statusConfig.pending;
          const { Icon } = cfg;

          return (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              {/* Left: number + status icon */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {payment.installment_number}
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Instalment {payment.installment_number}
                    {payment.installment_number === 1 && (
                      <span className="ml-1.5 text-xs text-muted">(First)</span>
                    )}
                    {payment.installment_number === totalCount && (
                      <span className="ml-1.5 text-xs text-muted">(Last)</span>
                    )}
                  </p>

                  {payment.paid_at ? (
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <CalendarDays className="h-3 w-3" />
                      Paid {formatDateTime(payment.paid_at)}
                    </p>
                  ) : payment.description ? (
                    <p className="line-clamp-1 text-xs text-muted">
                      {payment.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Right: amount + badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(payment.amount)}
                </span>
                <Badge variant={cfg.variant}>
                  <Icon className="mr-1 inline h-3 w-3" />
                  {cfg.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
