import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/payments/initiate
 * Initiates a payment for a pending payment record.
 *
 * Body: { payment_id, payment_method, account_number?, account_name? }
 *
 * Flow:
 *  1. Validate the payment belongs to the authenticated user and is pending
 *  2. Generate a transaction reference
 *  3. Update status → "processing"
 *  4. Return the reference for the client to show the user
 *
 * In production this would call the actual JazzCash / Easypaisa / card gateway.
 * For the FYP the gateway step is simulated; the webhook route completes the flow.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { payment_id, payment_method, account_number, account_name } = body;

    if (!payment_id || !payment_method) {
      return NextResponse.json(
        { error: "payment_id and payment_method are required" },
        { status: 400 }
      );
    }

    const validMethods = ["jazzcash", "easypaisa", "bank_transfer", "card"];
    if (!validMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: `payment_method must be one of: ${validMethods.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch and validate the payment
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, status, payer_id, amount, payment_type")
      .eq("id", payment_id)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.payer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 409 }
      );
    }

    // Generate a unique transaction reference
    const txRef = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Transition to processing
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "processing",
        payment_method,
        transaction_reference: txRef,
        // Optionally store partial account info (masked)
        description: account_number
          ? `Payment via ${payment_method} — Account: ...${String(account_number).slice(-4)}`
          : `Payment via ${payment_method}`,
      })
      .eq("id", payment_id)
      .eq("status", "pending"); // guard against race condition

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      transaction_reference: txRef,
      status: "processing",
      message: "Payment initiated. Awaiting confirmation.",
    });
  } catch (err) {
    console.error("POST /api/payments/initiate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
