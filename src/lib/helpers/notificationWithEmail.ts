/**
 * notificationWithEmail.ts
 *
 * Enhanced notification helper that sends both in-app notifications
 * AND email notifications to recipients.
 *
 * Usage:
 *   import { sendNotificationWithEmail } from "@/lib/helpers/notificationWithEmail";
 *   await sendNotificationWithEmail(supabase, {
 *     userId: targetUserId,
 *     userEmail: "user@example.com",
 *     title: "Hearing Scheduled",
 *     message: "A hearing has been scheduled for your case.",
 *     type: "hearing_scheduled",
 *     emailTemplate: "hearing_scheduled",
 *     emailData: { caseNumber, hearingDate, hearingTime },
 *     referenceType: "case",
 *     referenceId: caseId,
 *   });
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/notification";
import { sendCaseEmail, type EmailTemplate, type EmailData } from "@/lib/services/email";
import { sendNotification, sendNotifications, type NotificationPayload } from "./notification";

export interface NotificationWithEmailPayload extends NotificationPayload {
  /** User's email address for email notification */
  userEmail: string;
  /** Email template to use */
  emailTemplate: EmailTemplate;
  /** Data to populate email template */
  emailData: EmailData;
}

/**
 * Sends both in-app notification AND email notification to a single recipient.
 * In-app notification is always sent (fire-and-forget).
 * Email is sent asynchronously and errors don't block the operation.
 */
export async function sendNotificationWithEmail(
  supabase: SupabaseClient,
  payload: NotificationWithEmailPayload
): Promise<void> {
  // Send in-app notification (fire-and-forget)
  await sendNotification(supabase, {
    userId: payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
  });

  // Send email notification (async, non-blocking)
  sendCaseEmail({
    to: payload.userEmail,
    template: payload.emailTemplate,
    data: payload.emailData,
  }).catch((err) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notificationWithEmail] Email failed:", err);
    }
  });
}

/**
 * Sends notifications + emails to multiple recipients in batch.
 * Each recipient gets both an in-app notification and an email.
 */
export async function sendNotificationsWithEmails(
  supabase: SupabaseClient,
  payloads: NotificationWithEmailPayload[]
): Promise<void> {
  if (payloads.length === 0) return;

  // Send all in-app notifications in batch
  await sendNotifications(
    supabase,
    payloads.map((p) => ({
      userId: p.userId,
      title: p.title,
      message: p.message,
      type: p.type,
      referenceType: p.referenceType,
      referenceId: p.referenceId,
    }))
  );

  // Send emails to all recipients (async, non-blocking)
  // Group by email template for efficiency
  const emailGroups = new Map<EmailTemplate, { emails: string[]; data: EmailData }>();

  for (const payload of payloads) {
    const existing = emailGroups.get(payload.emailTemplate);
    if (existing) {
      existing.emails.push(payload.userEmail);
    } else {
      emailGroups.set(payload.emailTemplate, {
        emails: [payload.userEmail],
        data: payload.emailData,
      });
    }
  }

  // Send one email per template group
  for (const [template, { emails, data }] of emailGroups) {
    sendCaseEmail({
      to: emails,
      template,
      data,
    }).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[notificationWithEmails] Email batch failed for ${template}:`, err);
      }
    });
  }
}

/**
 * Helper to fetch case participants' emails from the database.
 * Returns email addresses for all parties involved in a case.
 */
export async function getCaseParticipantEmails(
  supabase: SupabaseClient,
  caseId: string
): Promise<{
  plaintiffEmail: string | null;
  defendantEmail: string | null;
  lawyerEmails: { side: "plaintiff" | "defendant"; email: string }[];
  judgeEmail: string | null;
  stenographerEmail: string | null;
}> {
  // Fetch case with all related parties
  const { data: caseData } = await supabase
    .from("cases")
    .select(`
      plaintiff:profiles!plaintiff_id(email),
      defendant:profiles!defendant_id(email),
      judge:profiles!trial_judge_id(email),
      stenographer:profiles!stenographer_id(email),
      assignments:case_assignments(
        side,
        status,
        lawyer:profiles!lawyer_id(email)
      )
    `)
    .eq("id", caseId)
    .single();

  if (!caseData) {
    return {
      plaintiffEmail: null,
      defendantEmail: null,
      lawyerEmails: [],
      judgeEmail: null,
      stenographerEmail: null,
    };
  }

  const lawyerEmails = (caseData.assignments || [])
    .filter((a: { status: string; lawyer?: { email: string } }) =>
      a.status === "accepted" && a.lawyer?.email
    )
    .map((a: { side: "plaintiff" | "defendant"; lawyer: { email: string } }) => ({
      side: a.side,
      email: a.lawyer.email,
    }));

  return {
    plaintiffEmail: (caseData.plaintiff as { email: string } | null)?.email || null,
    defendantEmail: (caseData.defendant as { email: string } | null)?.email || null,
    lawyerEmails,
    judgeEmail: (caseData.judge as { email: string } | null)?.email || null,
    stenographerEmail: (caseData.stenographer as { email: string } | null)?.email || null,
  };
}

/**
 * Helper to get all admin court officials' emails.
 */
export async function getAdminCourtEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "admin_court");

  return (data || []).map((p: { email: string }) => p.email);
}

/**
 * Helper to get all magistrates' emails.
 */
export async function getMagistrateEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "magistrate");

  return (data || []).map((p: { email: string }) => p.email);
}
