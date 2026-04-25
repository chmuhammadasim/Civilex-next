/**
 * API Route: POST /api/notifications/send
 * 
 * Sends in-app notification + email notification to a user.
 * Called from client-side hooks after database operations complete.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCaseEmail, type EmailTemplate, type EmailData } from "@/lib/services/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      userEmail,
      title,
      message,
      type,
      referenceType,
      referenceId,
      emailTemplate,
      emailData,
    } = body;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert in-app notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
    });

    if (notifError) {
      console.error("[Notification API] Failed to create notification:", notifError);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    // Send email if email details provided
    if (userEmail && emailTemplate && emailData) {
      await sendCaseEmail({
        to: userEmail,
        template: emailTemplate as EmailTemplate,
        data: emailData as EmailData,
      }).catch((err) => {
        // Log but don't fail the request
        console.error("[Notification API] Email failed:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notification API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
