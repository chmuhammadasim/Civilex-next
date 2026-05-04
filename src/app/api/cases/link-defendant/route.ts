/**
 * API Route: POST /api/cases/link-defendant
 *
 * Auto-links defendants to cases by matching their email address.
 * Delegates all logic to the `link_defendant_by_email` RPC which runs as
 * SECURITY DEFINER (bypasses RLS) but internally uses auth.uid() so it can
 * only act on behalf of the authenticated caller. No service-role key needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Call the SECURITY DEFINER RPC — it handles email matching, linking,
    // activity logging, and plaintiff notification all in one transaction.
    const { data, error } = await supabase
      .rpc("link_defendant_by_email");

    if (error) {
      console.error("[Link Defendant] RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // data is already typed as the jsonb return value: { linked: number, cases: [...] }
    const result = data as { linked: number; cases: { id: string; case_number: string; title: string }[] };

    return NextResponse.json({
      success: true,
      linked: result.linked ?? 0,
      cases: result.cases ?? [],
    });
  } catch (err) {
    console.error("[Link Defendant] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

