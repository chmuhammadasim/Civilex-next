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
      const { data: pendingPayments } = await supabase
        .from("payments")
        .select("id")
        .eq("case_id", caseId)
        .in("status", ["pending", "processing"]);

      // Get payment details and receiver info for notification
      const { data: paymentRow } = await supabase
        .from("payments")
        .select(`
          receiver_id,
          amount,
          case:cases(case_number, title),
          receiver:profiles!receiver_id(email, full_name)
        `)
        .eq("id", paymentId)
        .single();

      // Notify the receiver (lawyer) about the payment
      if (paymentRow?.receiver_id) {
        const caseInfo = paymentRow.case as unknown as { case_number: string; title: string } | null;
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

      // If no more pending payments, transition case status
      if (!pendingPayments || pendingPayments.length === 0) {
        await supabase
          .from("cases")
          .update({ status: "payment_confirmed" })
          .eq("id", caseId)
          .eq("status", "payment_pending");

        // Log activity
        await supabase.from("case_activity_log").insert({
          case_id: caseId,
          actor_id: user.id,
          action: "payment_confirmed",
          details: { payment_id: paymentId },
        });

        // Notify the payer (client) about full payment confirmation
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
          await sendNotificationWithEmailAPI({
            userId: user.id,
            userEmail: userProfile.email,
            title: "Payment Confirmed",
            message: `All payments have been confirmed for your case. Your case will now proceed to the next stage.`,
            type: "payment_completed",
            referenceType: "case",
            referenceId: caseId,
            emailTemplate: "payment_received",
            emailData: {
              caseNumber: caseData?.case_number || "N/A",
              caseTitle: caseData?.title || "Your Case",
              amount: "All installments",
              caseLink: `/cases/${caseId}`,
              nextStep: "Your case will now proceed to drafting stage.",
            },
          });
        }
      }

      await fetchPayments();
      return { error: null };
    } catch (err) {
      console.error("Error simulating payment:", err);
      return { error: "Payment simulation failed" };
    }
  };

  return {
    payments,
    isLoading,
    fetchPayments,
    createPayment,
    simulatePayment,
  };
}
