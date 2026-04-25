"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import { sendNotificationWithEmailAPI } from "@/lib/helpers/notificationAPI";
import type { PaymentWithRelations, PaymentMethod } from "@/types/payment";

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          case:cases(id, case_number, title),
          payer:profiles!payer_id(id, full_name, email),
          receiver:profiles!receiver_id(id, full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
      } else {
        setPayments((data as PaymentWithRelations[]) || []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = async (data: {
    case_id: string;
    receiver_id: string;
    amount: number;
    payment_type: string;
    payment_method: PaymentMethod;
    description?: string;
    is_installment?: boolean;
    installment_number?: number;
    total_installments?: number;
    parent_payment_id?: string;
  }) => {
    if (!user) return { error: "Not authenticated", data: null };

    try {
      const supabase = createClient();

      const { data: payment, error } = await supabase
        .from("payments")
        .insert({
          ...data,
          payer_id: user.id,
          status: "processing",
        })
        .select()
        .single();

      if (error) return { error: error.message, data: null };

      return { error: null, data: payment as PaymentWithRelations };
    } catch (err) {
      console.error("Error creating payment:", err);
      return { error: "Failed to create payment", data: null };
    }
  };

  const simulatePayment = async (paymentId: string, caseId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      // Simulate payment processing - mark as completed and verify
      const { data: updatedPayment, error: payError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          transaction_id: `TXN-${Date.now()}`,
          transaction_reference: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        })
        .eq("id", paymentId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (payError) return { error: payError.message };
      if (!updatedPayment) return { error: "Payment could not be processed. It may have already been completed." };

      // Check if all payments for this case are completed
      // The update above is committed, so this query sees the latest state
      const { data: pendingPayments, error: checkError } = await supabase
        .from("payments")
        .select("id")
        .eq("case_id", caseId)
        .in("status", ["pending", "processing"]);

      // If query failed, don't advance the case - stay safe
      if (checkError) {
        console.error("Error checking pending payments:", checkError);
        return { error: "Payment completed but unable to verify remaining installments. Please refresh." };
      }

      // Get payment details and receiver info for notification
      const { data: paymentRow } = await supabase
        .from("payments")
        .select(`
          receiver_id,
          amount,
          is_installment,
          installment_number,
          total_installments,
          case:cases(case_number, title, status),
          receiver:profiles!receiver_id(email, full_name)
        `)
        .eq("id", paymentId)
        .single();

      // Notify the receiver (lawyer) about the payment
      if (paymentRow?.receiver_id) {
        const caseInfo = paymentRow.case as unknown as { case_number: string; title: string; status: string } | null;
        const receiverInfo = paymentRow.receiver as unknown as { email: string; full_name: string } | null;
        
        if (receiverInfo?.email) {
          await sendNotificationWithEmailAPI({
            userId: paymentRow.receiver_id,
            userEmail: receiverInfo.email,
            title: "Payment Received",
            message: `A payment of PKR ${Number(paymentRow.amount).toLocaleString()} has been received for case "${caseInfo?.title || ""}".`,
            type: "payment_completed",
            referenceType: "case",
            referenceId: caseId,
            emailTemplate: "payment_received",
            emailData: {
              caseNumber: caseInfo?.case_number || "N/A",
              caseTitle: caseInfo?.title || "Your Case",
              amount: Number(paymentRow.amount).toLocaleString(),
              caseLink: `/cases/${caseId}`,
            },
          });
        }
      }

      // Advance case to payment_confirmed after FIRST payment (even if installments remain)
      // NEW BEHAVIOR: Case proceeds as soon as any payment is received
      const caseInfo = paymentRow?.case as unknown as { status: string } | null;
      if (caseInfo?.status === "payment_pending") {
        const { data: caseUpdate, error: caseError } = await supabase
          .from("cases")
          .update({ status: "payment_confirmed" })
          .eq("id", caseId)
          .eq("status", "payment_pending")
          .select("id")
          .maybeSingle();

        // Verify the case status was actually updated
        if (caseError) {
          console.error("Error updating case status:", caseError);
          // Payment succeeded but case status update failed
          // Return success anyway since payment is the critical part
        } else if (caseUpdate) {
          // Only log activity and send notification if case was actually updated
          // Log activity
          await supabase.from("case_activity_log").insert({
            case_id: caseId,
            actor_id: user.id,
            action: "payment_confirmed",
            details: { 
              payment_id: paymentId,
              installment_info: paymentRow?.is_installment 
                ? `${paymentRow.installment_number} of ${paymentRow.total_installments}`
                : "full payment"
            },
          });

          // Notify the payer (client) about payment confirmation
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .single();
          
          const { data: caseData } = await supabase
            .from("cases")
            .select("case_number, title")
            .eq("id", caseId)
            .single();
          
          if (userProfile?.email) {
            // Check if there are remaining installments
            const hasRemainingInstallments = pendingPayments && pendingPayments.length > 0;
            
            await sendNotificationWithEmailAPI({
              userId: user.id,
              userEmail: userProfile.email,
              title: "Payment Confirmed - Case Proceeding",
              message: hasRemainingInstallments
                ? `Your payment has been confirmed and your case will now proceed. You still have ${pendingPayments.length} remaining installment(s) to pay.`
                : `Your payment has been confirmed and your case will now proceed to the next stage.`,
              type: "payment_completed",
              referenceType: "case",
              referenceId: caseId,
              emailTemplate: "payment_received",
              emailData: {
                caseNumber: caseData?.case_number || "N/A",
                caseTitle: caseData?.title || "Your Case",
                amount: hasRemainingInstallments 
                  ? `First payment of ${Number(paymentRow?.amount || 0).toLocaleString()}` 
                  : "All payments",
                caseLink: `/cases/${caseId}`,
                nextStep: hasRemainingInstallments
                  ? `Your case will proceed to drafting. Please complete remaining ${pendingPayments.length} installment(s).`
                  : "Your case will now proceed to drafting stage.",
              },
            });
          }
        }
      }

      await fetchPayments();
      return { error: null };
    } catch (err) {
      console.error("Error simulating payment:", err);
      return { error: "Payment simulation failed" };
    }
  };

  const syncCasePaymentStatus = async (caseId: string) => {
    if (!user) return { error: "Not authenticated", updated: false };

    try {
      const supabase = createClient();

      console.log(`[syncCasePaymentStatus] Calling database function for case ${caseId}`);

      // Call the secure database function that bypasses RLS
      const { data, error } = await supabase.rpc('sync_payment_status', {
        target_case_id: caseId
      });

      if (error) {
        console.error(`[syncCasePaymentStatus] RPC error:`, error);
        return { 
          error: `Failed to sync: ${error.message}`, 
          updated: false 
        };
      }

      console.log(`[syncCasePaymentStatus] RPC response:`, data);

      // The function returns JSON with success, error, updated fields
      if (data && typeof data === 'object') {
        if (data.success && data.updated) {
          console.log(`[syncCasePaymentStatus] ✅ Case ${data.case_number} updated successfully`);
          console.log(`[syncCasePaymentStatus] Completed payments: ${data.completed_payments}`);
          await fetchPayments(); // Refresh payments list
          return { 
            error: null, 
            updated: true,
            message: data.message 
          };
        } else if (data.success && !data.updated) {
          console.log(`[syncCasePaymentStatus] ℹ️ ${data.message}`);
          return { 
            error: null, 
            updated: false,
            message: data.message 
          };
        } else {
          console.error(`[syncCasePaymentStatus] ❌ Function error: ${data.error}`);
          return { 
            error: data.error || 'Unknown error', 
            updated: false 
          };
        }
      }

      return { 
        error: 'Unexpected response format', 
        updated: false 
      };

    } catch (err) {
      console.error(`[syncCasePaymentStatus] Exception:`, err);
      return { 
        error: err instanceof Error ? err.message : 'Unknown error', 
        updated: false 
      };
    }
  };

  return {
    payments,
    isLoading,
    fetchPayments,
    createPayment,
    simulatePayment,
    syncCasePaymentStatus,
  };
}
