import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/cases
 * Returns cases for the authenticated user with role-based filtering.
 *
 * Query params:
 *   status   – filter by case_status
 *   type     – filter by case_type
 *   limit    – max rows (default 50)
 *   offset   – pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("cases")
      .select(
        `
        id, case_number, case_type, status, title, description,
        plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
        current_phase, sensitivity, filing_date, registration_date, next_hearing_date,
        created_at, updated_at,
        plaintiff:profiles!plaintiff_id(id, full_name, email),
        defendant:profiles!defendant_id(id, full_name, email),
        judge:profiles!trial_judge_id(id, full_name, email)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Role-based filtering
    if (profile.role === "client") {
      query = query.or(`plaintiff_id.eq.${user.id},defendant_id.eq.${user.id}`);
    } else if (profile.role === "lawyer") {
      // Lawyer sees cases through assignments — sub-select from case_assignments
      const { data: assignments } = await supabase
        .from("case_assignments")
        .select("case_id")
        .eq("lawyer_id", user.id);
      const caseIds = (assignments || []).map((a) => a.case_id);
      if (caseIds.length === 0) {
        return NextResponse.json({ data: [], count: 0 });
      }
      query = query.in("id", caseIds);
    } else if (profile.role === "admin_court") {
      query = query.eq("admin_court_id", user.id);
    } else if (profile.role === "trial_judge") {
      query = query.eq("trial_judge_id", user.id);
    } else if (profile.role === "stenographer") {
      query = query.eq("stenographer_id", user.id);
    }
    // magistrate sees all cases (RLS handles row-level restrictions)

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("case_type", type);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("GET /api/cases error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/cases
 * Create a new case (client role only).
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "client") {
      return NextResponse.json(
        { error: "Only clients can file cases" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      case_type,
      title,
      description,
      case_category,
      plaintiff_name,
      plaintiff_phone,
      plaintiff_cnic,
      defendant_name,
      defendant_phone,
    } = body;

    if (!case_type || !title) {
      return NextResponse.json(
        { error: "case_type and title are required" },
        { status: 400 }
      );
    }

    // Generate case number
    const prefix =
      case_type === "civil"
        ? "CIV"
        : case_type === "criminal"
        ? "CRM"
        : "FAM";
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("case_type", case_type);
    const seq = String((count || 0) + 1).padStart(4, "0");
    const case_number = `${prefix}-${year}-${seq}`;

    const { data, error } = await supabase
      .from("cases")
      .insert({
        case_number,
        case_type,
        title,
        description,
        case_category,
        plaintiff_id: user.id,
        plaintiff_name,
        plaintiff_phone,
        plaintiff_cnic,
        defendant_name,
        defendant_phone,
        status: "draft",
        filing_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/cases error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
