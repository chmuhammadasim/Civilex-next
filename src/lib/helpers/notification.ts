/**
 * notification.ts
 *
 * Centralised helper for inserting notifications into the `notifications` table.
 * Wraps the raw Supabase insert so all hooks use a consistent call pattern.
 *
 * Usage:
 *   import { sendNotification } from "@/lib/helpers/notification";
 *   await sendNotification(supabase, {
 *     userId: targetUserId,
 *     title: "Hearing Scheduled",
 *     message: "A hearing has been scheduled for your case.",
 *     type: "hearing_scheduled",
 *     referenceType: "case",
 *     referenceId: caseId,
 *   });
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/notification";

export interface NotificationPayload {
  /** The user who should receive this notification. */
  userId: string;
  /** Short heading shown in the notification list. */
  title: string;
  /** Longer description of what happened. */
  message: string;
  /** Notification category — must match the DB enum. */
  type: NotificationType;
  /** Entity type the notification relates to (e.g. "case", "hearing"). */
  referenceType?: string;
  /** ID of the related entity. */
  referenceId?: string;
}

/**
 * Inserts a single notification row.
 *
 * Errors are intentionally swallowed (fire-and-forget) because notification
 * failures should never block primary operations.  Errors are logged to the
 * console in development for debuggability.
 */
export async function sendNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    reference_type: payload.referenceType ?? null,
    reference_id: payload.referenceId ?? null,
  });

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[sendNotification] Failed to insert notification:", error);
  }
}

/**
 * Inserts notifications for multiple recipients in a single batch insert.
 * Silently skips empty arrays.
 */
export async function sendNotifications(
  supabase: SupabaseClient,
  payloads: NotificationPayload[]
): Promise<void> {
  if (payloads.length === 0) return;

  const rows = payloads.map((p) => ({
    user_id: p.userId,
    title: p.title,
    message: p.message,
    type: p.type,
    reference_type: p.referenceType ?? null,
    reference_id: p.referenceId ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[sendNotifications] Failed to insert notifications:", error);
  }
}
