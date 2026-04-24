import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET;

/**
 * POST /api/payments/webhook
 *
 * Receives payment status callbacks from the payment gateway (JazzCash / Easypaisa).
 * For the FYP this acts as a simulation endpoint — you can call it directly from
 * the client with a simulated success/failure to complete the payment flow.
 *
 * Production security: Verify the HMAC signature from the gateway before processing.
 *
 * Body:
 *   transaction_reference  – the ref returned by /api/payments/initiate
 *   status                 – "success" | "failure"
 *   gateway_transaction_id – gateway's own transaction ID
 *   signature              – HMAC-SHA256(transaction_reference + status, WEBHOOK_SECRET)
 *                            (skip verification when PAYMENT_WEBHOOK_SECRET is not set)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_reference, status, gateway_transaction_id, signature } = body;

    if (!transaction_reference || !status) {
      return NextResponse.json(
        { error: "transaction_reference and status are required" },
        { status: 400 }
      );
    }

    // Verify HMAC signature when a secret is configured
    if (WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(`${transaction_reference}${status}`)
        .digest("hex");
      const sigBuffer = Buffer.from(signature as string, "hex");
      const expBuffer = Buffer.from(expected, "hex");
      if (
        sigBuffer.length !== expBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expBuffer)
      ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!["success", "failure"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'success' or 'failure'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the payment by reference
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, case_id, payer_id, receiver_id, status, amount, payment_type, is_installment, installment_number, total_installments")
      .eq("transaction_reference", transaction_reference)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "processing") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 409 }
      );
    }

    const newStatus = status === "success" ? "completed" : "failed";
    const paidAt = status === "success" ? new Date().toISOString() : null;

    // Update the payment
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      ...(gateway_transaction_id ? { transaction_id: gateway_transaction_id } : {}),
      ...(paidAt ? { paid_at: paidAt } : {}),
    };

    const { error: updateError } = await supabase
      .from("payments")
      .update(updatePayload)
      .eq("id", payment.id)
      .eq("status", "processing"); // guard against duplicate webhooks

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If payment completed — check whether all payments for this case are done
    if (status === "success") {
      const { count: pendingCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("case_id", payment.case_id)
        .in("status", ["pending", "processing"]);

      if (pendingCount === 0) {
        // All payments complete — advance case status to payment_confirmed
        await supabase
          .from("cases")
          .update({ status: "payment_confirmed" })
          .eq("id", payment.case_id)
          .eq("status", "payment_pending");
      }

      // Notify the payer
      await supabase.from("notifications").insert({
        user_id: payment.payer_id,
        title: "Payment Successful",
        message: `Your payment of PKR ${payment.amount.toLocaleString()} has been confirmed. Reference: ${transaction_reference}`,
        type: "payment_completed",
        reference_type: "case",
        reference_id: payment.case_id,
      });
    } else {
      // Notify the payer of failure
      await supabase.from("notifications").insert({
        user_id: payment.payer_id,
        title: "Payment Failed",
        message: `Your payment of PKR ${payment.amount.toLocaleString()} could not be processed. Please try again.`,
        type: "payment_pending",
        reference_type: "case",
        reference_id: payment.case_id,
      });
    }

    return NextResponse.json({ message: "Webhook processed", status: newStatus });
  } catch (err) {
    console.error("POST /api/payments/webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
