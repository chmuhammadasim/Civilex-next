"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { feeStructureSchema } from "@/lib/validations/payment";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Info } from "lucide-react";

interface FeeStructureFormProps {
  onSubmit: (fee: number, allowInstallments: boolean, installmentCount: number) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  /** If provided, shows instalment breakdown preview */
  caseTitle?: string;
}

export default function FeeStructureForm({
  onSubmit,
  onCancel,
  isLoading = false,
  error = "",
  caseTitle,
}: FeeStructureFormProps) {
  const [feeAmount, setFeeAmount] = useState("");
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedFee = parseFloat(feeAmount) || 0;
  const parsedCount = parseInt(installmentCount) || 1;
  const instAmount = parsedFee && parsedCount > 1
    ? Math.ceil(parsedFee / parsedCount)
    : parsedFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = feeStructureSchema.safeParse({
      feeAmount: parseFloat(feeAmount),
      allowInstallments,
      installmentCount: parseInt(installmentCount),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(result.data.feeAmount, result.data.allowInstallments, result.data.installmentCount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {caseTitle && (
        <div className="rounded-lg bg-cream-light p-3">
          <p className="text-xs text-muted">Case</p>
          <p className="text-sm font-medium text-foreground line-clamp-2">{caseTitle}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Fee amount */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Total Fee (PKR)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="number"
            min="100"
            step="100"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full rounded-lg border border-border bg-cream-light px-3 py-2.5 pl-10 text-sm text-foreground placeholder-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {errors.feeAmount && (
          <p className="mt-1 text-xs text-danger">{errors.feeAmount}</p>
        )}
        {parsedFee > 0 && (
          <p className="mt-1 text-xs text-muted">
            = {formatCurrency(parsedFee)}
          </p>
        )}
      </div>

      {/* Instalment toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={allowInstallments ? "true" : "false"}
          title={allowInstallments ? "Disable instalments" : "Enable instalments"}
          onClick={() => {
            setAllowInstallments((v) => !v);
            if (allowInstallments) setInstallmentCount("1");
          }}
          className={[
            "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            allowInstallments ? "bg-primary" : "bg-border",
          ].join(" ")}>

        >
          <span
            className={[
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              allowInstallments ? "translate-x-4" : "translate-x-0",
            ].join(" ")}
          />
        </button>
        <span className="text-sm text-foreground">Allow instalment payments</span>
      </div>

      {/* Instalment count */}
      {allowInstallments && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Number of Instalments
          </label>
          <select
            value={installmentCount}
            onChange={(e) => setInstallmentCount(e.target.value)}
            aria-label="Number of instalments"
            className="w-full rounded-lg border border-border bg-cream-light px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {[2, 3, 4, 6, 12].map((n) => (
              <option key={n} value={n}>
                {n} instalments
              </option>
            ))}
          </select>
          {errors.installmentCount && (
            <p className="mt-1 text-xs text-danger">{errors.installmentCount}</p>
          )}
        </div>
      )}

      {/* Preview */}
      {parsedFee > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              {allowInstallments && parsedCount > 1 ? (
                <>
                  <p className="text-sm font-medium text-primary">
                    {parsedCount} instalments of {formatCurrency(instAmount)} each
                  </p>
                  <p className="text-xs text-muted">
                    (last instalment may be slightly less if fee doesn&apos;t divide evenly)
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-primary">
                  Single payment of {formatCurrency(parsedFee)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          Confirm Fee Structure
        </Button>
      </div>
    </form>
  );
}
