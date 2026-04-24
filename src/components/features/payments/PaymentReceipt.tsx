"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, Download, CheckCircle, Building2, Smartphone, CreditCard } from "lucide-react";
import type { PaymentWithRelations } from "@/types/payment";

interface PaymentReceiptProps {
  payment: PaymentWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

const methodLabels: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  card: "Credit / Debit Card",
};

const paymentTypeLabels: Record<string, string> = {
  court_fee: "Court Fee",
  lawyer_fee: "Lawyer Fee",
  stamp_duty: "Stamp Duty",
  miscellaneous: "Miscellaneous",
};

export default function PaymentReceipt({ payment, isOpen, onClose }: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For FYP: trigger browser print-to-PDF dialog
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" className="max-w-lg">
      <div className="space-y-4">
        {/* Receipt */}
        <div ref={receiptRef} className="rounded-xl border border-border bg-white p-6 print:border-0 print:p-0">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Payment Confirmed</h2>
            <p className="mt-1 text-sm text-muted">Official Court Payment Receipt</p>
          </div>

          {/* Divider with dots */}
          <div className="my-4 border-t border-dashed border-border" />

          {/* Amount */}
          <div className="mb-6 rounded-lg bg-cream-light p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wide">Amount Paid</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {formatCurrency(payment.amount)}
            </p>
            {payment.is_installment && payment.total_installments > 1 && (
              <p className="mt-1 text-xs text-muted">
                Instalment {payment.installment_number} of {payment.total_installments}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <ReceiptRow label="Receipt No." value={payment.transaction_id || payment.id.slice(0, 8).toUpperCase()} mono />
            <ReceiptRow
              label="Payment Type"
              value={paymentTypeLabels[payment.payment_type] || payment.payment_type}
            />
            {payment.payment_method && (
              <ReceiptRow
                label="Payment Method"
                value={methodLabels[payment.payment_method] || payment.payment_method}
              />
            )}
            {payment.transaction_reference && (
              <ReceiptRow label="Reference" value={payment.transaction_reference} mono />
            )}
            {payment.paid_at && (
              <ReceiptRow label="Date & Time" value={formatDateTime(payment.paid_at)} />
            )}
            {payment.case && (
              <>
                <div className="border-t border-dashed border-border pt-3" />
                <ReceiptRow label="Case No." value={payment.case.case_number} />
                <ReceiptRow label="Case" value={payment.case.title} />
              </>
            )}
            {payment.payer && (
              <>
                <div className="border-t border-dashed border-border pt-3" />
                <ReceiptRow label="Paid By" value={payment.payer.full_name} />
              </>
            )}
            {payment.receiver && (
              <ReceiptRow label="Received By" value={payment.receiver.full_name} />
            )}
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          {/* Footer */}
          <p className="text-center text-xs text-muted">
            This is a computer-generated receipt. No signature required.
            <br />
            Civilex Judiciary Management System
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button className="flex-1" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Save as PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReceiptRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={["text-sm font-medium text-foreground text-right", mono ? "font-mono text-xs" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}
