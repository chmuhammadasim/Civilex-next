/**
 * Client-side helper for sending notifications with emails via API route.
 * 
 * Usage in hooks:
 *   import { sendNotificationWithEmailAPI } from "@/lib/helpers/notificationAPI";
 *   await sendNotificationWithEmailAPI({
 *     userId: "...",
 *     userEmail: "user@example.com",
 *     title: "Payment Received",
 *     message: "...",
 *     type: "payment_completed",
 *     emailTemplate: "payment_received",
 *     emailData: { ... }
 *   });
 */

import type { NotificationType } from "@/types/notification";
import type { EmailTemplate, EmailData } from "@/lib/services/email";

export interface NotificationWithEmailPayload {
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceType?: "case" | "hearing" | "payment" | "document";
  referenceId?: string;
  emailTemplate: EmailTemplate;
  emailData: EmailData;
}

/**
 * Sends both in-app notification AND email notification via server API route.
 * Safe to call from client-side hooks.
 */
export async function sendNotificationWithEmailAPI(
  payload: NotificationWithEmailPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to send notification" };
    }

    return { success: true };
  } catch (error) {
    console.error("[notificationAPI] Failed:", error);
    return { success: false, error: "Network error" };
  }
}
