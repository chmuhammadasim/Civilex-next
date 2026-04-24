import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user.
 *
 * Query params:
 *   unread_only  – "true" to return only unread
 *   limit        – max rows (default 20, max 100)
 *   offset       – pagination offset (default 0)
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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read.
 *
 * Body: { ids?: string[] }  — omit ids to mark all as read.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id); // ensure user can only update their own

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications.
 *
 * Body: { ids?: string[] }  — omit ids to clear all notifications for the user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    let query = supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id); // ensure user can only delete their own

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Notifications deleted" });
  } catch (err) {
    console.error("DELETE /api/notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
