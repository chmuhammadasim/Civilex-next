"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import PaymentForm from "@/components/features/payments/PaymentForm";
import PaymentReceipt from "@/components/features/payments/PaymentReceipt";
import InstallmentPlan from "@/components/features/payments/InstallmentPlan";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  FileText,
  Building2,
  Smartphone,
  Printer,
} from "lucide-react";
import type { PaymentWithRelations } from "@/types/payment";

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default"; icon: React.ReactNode }
> = {
  completed: { label: "Completed", variant: "success", icon: <CheckCircle className="h-4 w-4" /> },
  pending: { label: "Pending", variant: "warning", icon: <Clock className="h-4 w-4" /> },
  processing: { label: "Processing", variant: "info", icon: <Clock className="h-4 w-4" /> },
  failed: { label: "Failed", variant: "danger", icon: <XCircle className="h-4 w-4" /> },
  refunded: { label: "Refunded", variant: "default", icon: <RotateCcw className="h-4 w-4" /> },
};

const methodIcons: Record<string, React.ReactNode> = {
  jazzcash: <Smartphone className="h-4 w-4 text-red-500" />,
  easypaisa: <Smartphone className="h-4 w-4 text-green-600" />,
  bank_transfer: <Building2 className="h-4 w-4 text-blue-600" />,
  card: <CreditCard className="h-4 w-4 text-indigo-600" />,
};

const methodLabels: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  card: "Card",
};

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { payments, isLoading, fetchPayments, simulatePayment } = usePayments();
  const [payment, setPayment] = useState<PaymentWithRelations | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (payments.length > 0) {
      const found = payments.find((p) => p.id === paymentId);
      setPayment(found || null);
    }
  }, [payments, paymentId]);

  if (isLoading) {
    return (
      <div>
        <Topbar title="Payment Details" />
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div>
        <Topbar title="Payment Details" />
        <div className="p-6">
          <div className="rounded-lg border border-border bg-cream-light p-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted" />
            <p className="text-lg font-medium text-foreground">Payment not found</p>
            <p className="mt-1 text-sm text-muted">
              This payment record does not exist or you don&apos;t have access.
            </p>
            <Button className="mt-6" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[payment.status] || { label: payment.status, variant: "default" as const, icon: null };
  const canPay = payment.status === "pending" && user?.id === payment.payer_id;
  const isInstallment = payment.is_installment && payment.total_installments > 1;

  return (
    <div>
      <Topbar title="Payment Details" />

      <div className="p-6">
        {/* Back link */}
        <Link
          href="/payments"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status banner */}
            <div
              className={[
                "rounded-xl p-6 border",
                payment.status === "completed"
                  ? "border-success bg-success/5"
                  : payment.status === "failed"
                  ? "border-danger bg-danger/5"
                  : "border-warning bg-warning/5",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Total Amount</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  {isInstallment && (
                    <p className="mt-1 text-sm text-muted">
                      Instalment {payment.installment_number} of {payment.total_installments}
                    </p>
                  )}
                </div>
                <Badge variant={statusInfo.variant} className="text-sm px-3 py-1.5 flex items-center gap-1.5">
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Payment details */}
            <Card>
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Payment Information
              </h2>
              <div className="divide-y divide-border">
                <DetailRow label="Payment ID" value={payment.id} mono />
                <DetailRow
                  label="Payment Type"
                  value={payment.payment_type.replace(/_/g, " ")}
                  capitalize
                />
                {payment.payment_method && (
                  <DetailRow
                    label="Payment Method"
                    value={
                      <span className="flex items-center gap-2">
                        {methodIcons[payment.payment_method]}
                        {methodLabels[payment.payment_method] || payment.payment_method}
                      </span>
                    }
                  />
                )}
                {payment.transaction_id && (
                  <DetailRow label="Transaction ID" value={payment.transaction_id} mono />
                )}
                {payment.transaction_reference && (
                  <DetailRow label="Reference" value={payment.transaction_reference} mono />
                )}
                <DetailRow
                  label="Created"
                  value={formatDateTime(payment.created_at)}
                />
                {payment.paid_at && (
                  <DetailRow
                    label="Paid At"
                    value={formatDateTime(payment.paid_at)}
                  />
                )}
                {payment.description && (
                  <DetailRow label="Description" value={payment.description} />
                )}
              </div>
            </Card>

            {/* Case info */}
            {payment.case && (
              <Card>
                <h2 className="mb-4 text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Related Case
                </h2>
                <Link
                  href={`/cases/${payment.case_id}`}
                  className="flex items-center justify-between rounded-lg bg-cream-light p-4 hover:bg-cream-dark transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {payment.case.case_number}
                    </p>
                    <p className="text-sm text-muted line-clamp-1">
                      {payment.case.title}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted" />
                </Link>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Parties */}
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
                Parties
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted">Payer</p>
                  <p className="font-medium text-foreground">
                    {payment.payer?.full_name || "—"}
                  </p>
                  <p className="text-xs text-muted">{payment.payer?.email}</p>
                </div>
                {payment.receiver && (
                  <div>
                    <p className="text-xs text-muted">Receiver</p>
                    <p className="font-medium text-foreground">
                      {payment.receiver.full_name}
                    </p>
                    <p className="text-xs text-muted">{payment.receiver.email}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Instalment plan */}
            {isInstallment && (() => {
              // Collect all sibling instalments from the payments list
              const siblings = payments.filter(
                (p) =>
                  p.is_installment &&
                  p.case_id === payment.case_id &&
                  p.payment_type === payment.payment_type
              );
              return siblings.length > 0 ? (
                <InstallmentPlan payments={siblings} />
              ) : null;
            })()}

            {/* Actions */}
            <div className="space-y-2">
              {canPay && (
                <Button
                  className="w-full"
                  onClick={() => setShowPayModal(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}
              {payment.status === "completed" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReceipt(true)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  View Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pay modal */}
      {showPayModal && (
        <PaymentForm
          payment={payment}
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false);
            fetchPayments();
          }}
        />
      )}

      {/* Receipt modal */}
      {showReceipt && (
        <PaymentReceipt
          payment={payment}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

// Helper component
function DetailRow({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <span
        className={[
          "text-sm text-foreground text-right",
          mono ? "font-mono text-xs break-all" : "",
          capitalize ? "capitalize" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
