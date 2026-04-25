/**
 * API Route: POST /api/cases/link-defendant
 * 
 * Auto-links defendants to cases by matching their email address.
 * Called when a client logs in to check if they're a defendant in any cases.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "client") {
      return NextResponse.json({ linked: 0 }, { status: 200 });
    }

    // Find cases where defendant_email matches but defendant_id is not set
    const { data: matchingCases, error: queryError } = await supabase
      .from("cases")
      .select("id, case_number, title, defendant_email, plaintiff_id")
      .eq("defendant_email", profile.email)
      .is("defendant_id", null);

    if (queryError) {
      console.error("[Link Defendant] Query error:", queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!matchingCases || matchingCases.length === 0) {
      return NextResponse.json({ linked: 0 }, { status: 200 });
    }

    let linkedCount = 0;

    for (const caseRow of matchingCases) {
      // Skip if user is the plaintiff (can't be defendant of own case)
      if (caseRow.plaintiff_id === user.id) {
        continue;
      }

      // Link defendant_id
      const { error: updateError } = await supabase
        .from("cases")
        .update({
          defendant_id: user.id,
          defendant_claim_token: null, // Clear claim token
          defendant_claim_expires_at: null,
        })
        .eq("id", caseRow.id)
        .is("defendant_id", null); // Safety: only update if still unlinked

      if (updateError) {
        console.error(`[Link Defendant] Failed to link case ${caseRow.id}:`, updateError);
        continue;
      }

      linkedCount++;

      // Log activity
      await supabase.from("case_activity_log").insert({
        case_id: caseRow.id,
        actor_id: user.id,
        action: "defendant_auto_linked",
        details: {
          defendant_name: profile.full_name,
          matched_email: profile.email,
        },
      });

      // Notify plaintiff
      if (caseRow.plaintiff_id) {
        await supabase.from("notifications").insert({
          user_id: caseRow.plaintiff_id,
          title: "Defendant Registered",
          message: `The defendant "${profile.full_name}" has registered for case "${caseRow.title}" (${caseRow.case_number}).`,
          type: "case_status_changed",
          reference_type: "case",
          reference_id: caseRow.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      linked: linkedCount,
      cases: matchingCases.map((c) => ({
        id: c.id,
        case_number: c.case_number,
        title: c.title,
      })),
    });
  } catch (err) {
    console.error("[Link Defendant] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
