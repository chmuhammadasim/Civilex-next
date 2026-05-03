import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCaseEmail } from "@/lib/services/email";

/**
 * POST /api/cases/notify-filed
 * Called after a case is created to notify:
 *  - Plaintiff (confirmation email)
 *  - Defendant (if defendant_email is provided on the case)
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
    const { case_id } = body;

    if (!case_id) {
      return NextResponse.json({ error: "case_id is required" }, { status: 400 });
    }

    // Fetch the case with plaintiff profile
    const { data: caseRow, error } = await supabase
      .from("cases")
      .select(
        "id, case_number, title, defendant_name, defendant_email, plaintiff_id, plaintiff:profiles!plaintiff_id(full_name, email)"
      )
      .eq("id", case_id)
      .eq("plaintiff_id", user.id) // Only the filing user can trigger this
      .single();

    if (error || !caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const plaintiff = caseRow.plaintiff as unknown as { full_name: string; email: string } | null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const caseLink = `${appUrl}/cases/${caseRow.id}`;
    const registerUrl = `${appUrl}/register`;

    const emailData = {
      caseNumber: caseRow.case_number,
      caseTitle: caseRow.title,
      plaintiffName: plaintiff?.full_name || "Plaintiff",
      defendantName: caseRow.defendant_name || "Defendant",
      caseLink,
    };

    // Send confirmation to plaintiff
    if (plaintiff?.email) {
      await sendCaseEmail({
        to: plaintiff.email,
        template: "case_filed",
        data: {
          ...emailData,
          message: "Your case has been filed successfully. You will be notified as it progresses.",
        },
      });
    }

    // Send notification to defendant if email provided
    if (caseRow.defendant_email) {
      await sendCaseEmail({
        to: caseRow.defendant_email,
        template: "case_filed",
        data: {
          ...emailData,
          message: `A case has been filed against you. Please register on Civilex (${registerUrl}) using this email address to access the case, hire a lawyer, and respond.`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-filed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
