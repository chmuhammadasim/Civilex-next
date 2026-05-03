"use client";

import { useState } from "react";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import PaymentForm from "@/components/features/payments/PaymentForm";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { Search, CreditCard } from "lucide-react";
import type { PaymentWithRelations } from "@/types/payment";

const statusVariants: Record<string, "default" | "success" | "danger" | "warning" | "info"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "danger",
  refunded: "default",
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const { payments, isLoading, fetchPayments, syncCasePaymentStatus } = usePayments();
  const [search, setSearch] = useState("");
  const [payingPayment, setPayingPayment] = useState<PaymentWithRelations | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Check if there are any cases that need status update
  const casesNeedingSync = [...new Set(
    payments
      .filter(p => p.status === "completed" && p.case_id)
      .map(p => p.case_id)
  )];

  const filtered = payments.filter(
    (p) =>
      (p.case?.case_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.case?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.transaction_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "case_number",
      label: "Case",
      render: (item: PaymentWithRelations) => (
        <div>
          <p className="font-medium">{item.case?.case_number || "—"}</p>
          <p className="text-xs text-muted line-clamp-1">
            {item.case?.title || ""}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (item: PaymentWithRelations) => (
        <span className="capitalize text-sm">
          {item.payment_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "counterparty",
      label: user?.role === "lawyer" ? "Client" : "Lawyer",
      render: (item: PaymentWithRelations) => {
        const person = user?.role === "lawyer" ? item.payer : item.receiver;
        return (
          <span className="text-sm">
            {person?.full_name || "—"}
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (item: PaymentWithRelations) => (
        <div>
          <p className="font-medium">{formatCurrency(item.amount)}</p>
          {item.is_installment && (
            <p className="text-xs text-muted">
              {item.installment_number}/{item.total_installments}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: PaymentWithRelations) => (
        <Badge variant={statusVariants[item.status] || "default"}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: PaymentWithRelations) => (
        <span className="text-sm">
          {item.paid_at ? formatDate(item.paid_at) : formatDate(item.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: PaymentWithRelations) => (
        <div className="flex gap-2">
          {item.status === "pending" && user?.id === item.payer_id && (
            <Button
              size="sm"
              onClick={() => setPayingPayment(item)}
            >
              Pay Now
            </Button>
          )}
          <Link href={`/payments/${item.id}`}>
            <Button size="sm" variant="ghost">View</Button>
          </Link>
          {item.status === "completed" && (
            <Button
              size="sm"
              variant="ghost"
              title="Download Receipt"
              onClick={async () => {
                const { jsPDF } = await import("jspdf");
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("Civilex — Judiciary Management System", 105, 28, { align: "center" });
                doc.setLineWidth(0.5);
                doc.line(14, 33, 196, 33);
                const rows: [string, string][] = [
                  ["Receipt ID", item.id.slice(0, 8).toUpperCase()],
                  ["Transaction ID", item.transaction_id ?? "N/A"],
                  ["Case Number", item.case?.case_number ?? "N/A"],
                  ["Case Title", item.case?.title ?? "N/A"],
                  ["Payment Type", item.payment_type.replace(/_/g, " ")],
                  ["Amount", formatCurrency(item.amount)],
                  ["Status", "Completed"],
                  ["Paid On", item.paid_at ? formatDate(item.paid_at) : "N/A"],
                  ["Payer", item.payer?.full_name ?? "N/A"],
                  ["Receiver", item.receiver?.full_name ?? "N/A"],
                ];
                let y = 44;
                for (const [label, value] of rows) {
                  doc.setFont("helvetica", "bold");
                  doc.text(label + ":", 20, y);
                  doc.setFont("helvetica", "normal");
                  doc.text(value, 80, y);
                  y += 10;
                }
                doc.setLineWidth(0.3);
                doc.line(14, y + 4, 196, y + 4);
                doc.setFontSize(9);
                doc.setTextColor(120);
                doc.text("This is a computer-generated receipt and does not require a signature.", 105, y + 12, { align: "center" });
                doc.save(`receipt-${item.id.slice(0, 8)}.pdf`);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Summary stats
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  // Function to sync all cases that have completed payments
  const handleSyncAllCases = async () => {
    if (casesNeedingSync.length === 0 || syncing) return;
    
    setSyncing(true);
    try {
      console.log(`[PaymentsPage] Syncing ${casesNeedingSync.length} cases...`);
      for (const caseId of casesNeedingSync) {
        const result = await syncCasePaymentStatus(caseId);
        console.log(`[PaymentsPage] Sync result for case ${caseId}:`, result);
      }
      // Force refresh to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("[PaymentsPage] Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <Topbar title="Payments" />

      <div className="p-6">
        {/* Sync Alert */}
        {casesNeedingSync.length > 0 && totalPending === 0 && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-amber-900">
                  Case Status Update Available
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  You have completed all payments for {casesNeedingSync.length} case(s), but the case status may not be updated yet. Click the button to update your case status.
                </p>
              </div>
              <Button
                onClick={handleSyncAllCases}
                disabled={syncing}
                size="sm"
                variant="primary"
              >
                {syncing ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-cream-light p-4">
            <p className="text-sm text-muted">Total Paid</p>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-cream-light p-4">
            <p className="text-sm text-muted">Pending</p>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-cream-light p-4">
            <p className="text-sm text-muted">Total Payments</p>
            <p className="text-2xl font-bold text-primary-dark">
              {payments.length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by case number, title, or transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payments Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title={payments.length === 0 ? "No payments yet" : "No payments found"}
            description={
              payments.length === 0
                ? user?.role === "client"
                  ? "Payments will appear here once a lawyer accepts your case and sets their fee. Court fees will also be listed when your case is submitted for registration."
                  : user?.role === "lawyer"
                  ? "You'll see payment records here once you accept cases and set your fee. Clients will pay you through this system."
                  : "Payment records from all cases will appear here."
                : "Try adjusting your search"
            }
          />
        ) : (
          <Table 
            columns={columns} 
            data={filtered}
            keyExtractor={(item) => item.id}
          />
        )}

        {/* Payment Modal */}
        {payingPayment && (
          <PaymentForm
            payment={payingPayment}
            isOpen={true}
            onClose={() => setPayingPayment(null)}
            onSuccess={() => {
              setPayingPayment(null);
              fetchPayments();
            }}
          />
        )}
      </div>
    </div>
  );
}
