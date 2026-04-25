/**
 * email.ts
 *
 * Centralized email service using Resend.
 * Sends transactional emails to all parties (clients, lawyers, judges, court staff)
 * for case updates, hearings, summons, judgments, etc.
 *
 * Usage:
 *   import { sendCaseEmail } from "@/lib/services/email";
 *   await sendCaseEmail({
 *     to: ["user@example.com"],
 *     template: "case_accepted",
 *     data: { caseNumber, caseTitle, lawyerName }
 *   });
 */

import { Resend } from "resend";

// Lazy initialization to avoid errors when imported on client-side
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  // Only initialize on server-side where RESEND_API_KEY is available
  if (typeof window === "undefined") {
    if (!resend && process.env.RESEND_API_KEY) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
  }
  return null; // Client-side: return null (emails shouldn't be sent from browser anyway)
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Civilex <noreply@civilex.pk>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type EmailTemplate =
  | "case_assigned" // Lawyer assigned to case
  | "case_accepted" // Lawyer accepted case
  | "case_declined" // Lawyer declined case
  | "payment_reminder" // Payment due reminder
  | "payment_received" // Payment confirmed
  | "case_submitted" // Case submitted to admin court
  | "case_returned" // Case returned for revision
  | "case_registered" // Case officially registered
  | "summon_issued" // Defendant summon issued
  | "hearing_scheduled" // Hearing scheduled notification
  | "hearing_reminder" // 24h before hearing
  | "scrutiny_approved" // Admin approved case
  | "order_issued" // Court order issued
  | "judgment_delivered" // Final judgment
  | "case_transferred" // Transferred to trial court
  | "case_stayed" // Case stayed/suspended
  | "case_withdrawn" // Case withdrawn
  | "case_disposed" // Case disposed
  | "bail_decision" // Bail granted/denied
  | "evidence_uploaded" // New evidence added
  | "witness_summoned" // Witness summons
  | "appeal_filed"; // Appeal filed

export interface EmailData {
  // Common fields
  caseNumber?: string;
  caseTitle?: string;
  caseLink?: string;
  
  // Party names
  plaintiffName?: string;
  defendantName?: string;
  lawyerName?: string;
  judgeName?: string;
  
  // Dates and times
  hearingDate?: string;
  hearingTime?: string;
  deadline?: string;
  
  // Amounts
  amount?: string;
  feeAmount?: string;
  
  // Additional context
  message?: string;
  reason?: string;
  remarks?: string;
  orderText?: string;
  judgmentSummary?: string;
  nextStep?: string;
  newStatus?: string;
}

export interface EmailPayload {
  to: string | string[];
  template: EmailTemplate;
  data: EmailData;
  cc?: string[];
  bcc?: string[];
}

/**
 * Send a templated email to one or more recipients.
 * Errors are logged but don't throw to avoid breaking primary operations.
 */
export async function sendCaseEmail(payload: EmailPayload): Promise<boolean> {
  // Skip if running on client-side (should never happen, but safety check)
  if (typeof window !== "undefined") {
    console.warn("[EMAIL] Cannot send emails from client-side");
    return false;
  }

  // Skip in development unless explicitly enabled
  if (process.env.NODE_ENV === "development" && !process.env.ENABLE_EMAILS) {
    console.log("[EMAIL] Skipped (dev mode):", {
      to: payload.to,
      template: payload.template,
      data: payload.data,
    });
    return true;
  }

  // Get Resend client (will be null if API key not configured)
  const client = getResendClient();
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[EMAIL] Resend API key not configured. Email not sent:", payload.template);
    }
    return false;
  }

  try {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const { subject, html, text } = generateEmailContent(payload.template, payload.data);

    await client.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      cc: payload.cc,
      bcc: payload.bcc,
      subject,
      html,
      text,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[EMAIL] Sent successfully:", {
        to: recipients,
        template: payload.template,
        subject,
      });
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}

/**
 * Generate email subject, HTML, and plain text for a given template.
 */
function generateEmailContent(
  template: EmailTemplate,
  data: EmailData
): { subject: string; html: string; text: string } {
  const caseLink = data.caseLink || `${BASE_URL}/cases`;
  
  const templates: Record<EmailTemplate, { subject: string; html: string; text: string }> = {
    case_assigned: {
      subject: `New Case Assignment: ${data.caseNumber || ""}`,
      html: `
        <h2>New Case Assignment</h2>
        <p>You have been assigned as lawyer for the case:</p>
        <ul>
          <li><strong>Case Number:</strong> ${data.caseNumber}</li>
          <li><strong>Case Title:</strong> ${data.caseTitle}</li>
          <li><strong>Client:</strong> ${data.plaintiffName || data.defendantName}</li>
        </ul>
        <p>Please review the case details and accept or decline the assignment.</p>
        <p><a href="${caseLink}">View Case Details</a></p>
      `,
      text: `New Case Assignment\n\nYou have been assigned as lawyer for case ${data.caseNumber} - ${data.caseTitle}.\n\nPlease review and respond at: ${caseLink}`,
    },

    case_accepted: {
      subject: `Lawyer Accepted Your Case: ${data.caseNumber || ""}`,
      html: `
        <h2>Lawyer Has Accepted Your Case</h2>
        <p><strong>${data.lawyerName}</strong> has accepted your case <strong>${data.caseNumber}</strong>.</p>
        <p><strong>Lawyer Fee:</strong> ${data.feeAmount}</p>
        <p>Please proceed with the payment to move forward with your case.</p>
        <p><a href="${caseLink}">View Case & Make Payment</a></p>
      `,
      text: `Lawyer Has Accepted Your Case\n\n${data.lawyerName} has accepted case ${data.caseNumber}.\nFee: ${data.feeAmount}\n\nView case at: ${caseLink}`,
    },

    case_declined: {
      subject: `Lawyer Declined Your Case: ${data.caseNumber || ""}`,
      html: `
        <h2>Lawyer Declined Your Case</h2>
        <p>The lawyer has declined to represent you in case <strong>${data.caseNumber}</strong>.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
        <p>You can assign a different lawyer from our lawyer directory.</p>
        <p><a href="/lawyers">Browse Lawyers</a></p>
      `,
      text: `Lawyer Declined Your Case\n\nCase ${data.caseNumber} has been declined.${data.reason ? `\nReason: ${data.reason}` : ""}\n\nFind another lawyer at: ${BASE_URL}/lawyers`,
    },

    payment_reminder: {
      subject: `Payment Reminder: ${data.caseNumber || ""}`,
      html: `
        <h2>Payment Reminder</h2>
        <p>This is a reminder that payment is pending for case <strong>${data.caseNumber}</strong>.</p>
        <p><strong>Amount Due:</strong> ${data.amount}</p>
        ${data.deadline ? `<p><strong>Due Date:</strong> ${data.deadline}</p>` : ""}
        <p>Please complete the payment to proceed with your case.</p>
        <p><a href="${caseLink}">Make Payment</a></p>
      `,
      text: `Payment Reminder\n\nPayment pending for case ${data.caseNumber}\nAmount: ${data.amount}${data.deadline ? `\nDue: ${data.deadline}` : ""}\n\nPay at: ${caseLink}`,
    },

    payment_received: {
      subject: `Payment Received: ${data.caseNumber || ""}`,
      html: `
        <h2>Payment Received</h2>
        <p>Your payment of <strong>${data.amount}</strong> for case <strong>${data.caseNumber}</strong> has been received.</p>
        <p>Your lawyer can now proceed with drafting your case documents.</p>
        <p><a href="${caseLink}">View Case</a></p>
      `,
      text: `Payment Received\n\nPayment of ${data.amount} received for case ${data.caseNumber}.\n\nView case at: ${caseLink}`,
    },

    case_submitted: {
      subject: `Case Submitted for Review: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Submitted for Administrative Review</h2>
        <p>Case <strong>${data.caseNumber}</strong> - <strong>${data.caseTitle}</strong> has been submitted to the Admin Court for scrutiny.</p>
        <p>The court will review the case documents and notify you of the decision.</p>
        <p><a href="${caseLink}">View Case Status</a></p>
      `,
      text: `Case Submitted for Review\n\nCase ${data.caseNumber} submitted to Admin Court for scrutiny.\n\nView at: ${caseLink}`,
    },

    case_returned: {
      subject: `Case Returned for Revision: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Returned for Revision</h2>
        <p>Case <strong>${data.caseNumber}</strong> has been returned by the Admin Court for revision.</p>
        ${data.remarks ? `<p><strong>Court Remarks:</strong> ${data.remarks}</p>` : ""}
        <p>Please address the issues and resubmit the case.</p>
        <p><a href="${caseLink}">View Case & Revise</a></p>
      `,
      text: `Case Returned for Revision\n\nCase ${data.caseNumber} returned by Admin Court.${data.remarks ? `\nRemarks: ${data.remarks}` : ""}\n\nView at: ${caseLink}`,
    },

    case_registered: {
      subject: `Case Officially Registered: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Officially Registered</h2>
        <p>Your case <strong>${data.caseNumber}</strong> has been officially registered with the court.</p>
        <p><strong>Case Title:</strong> ${data.caseTitle}</p>
        <p>${data.nextStep || "The next hearing will be scheduled shortly."}</p>
        <p><a href="${caseLink}">View Case File</a></p>
      `,
      text: `Case Officially Registered\n\nCase ${data.caseNumber} registered.\nTitle: ${data.caseTitle}\n\n${data.nextStep || "Hearing will be scheduled shortly."}\n\nView at: ${caseLink}`,
    },

    summon_issued: {
      subject: `Court Summon Issued: ${data.caseNumber || ""}`,
      html: `
        <h2>Court Summon Issued</h2>
        <p>A summon has been issued for case <strong>${data.caseNumber}</strong>.</p>
        <p><strong>Plaintiff:</strong> ${data.plaintiffName}</p>
        <p><strong>Defendant:</strong> ${data.defendantName}</p>
        <p>All parties are required to appear in court as scheduled.</p>
        <p><a href="${caseLink}">View Summon Details</a></p>
      `,
      text: `Court Summon Issued\n\nSummon issued for case ${data.caseNumber}\nPlaintiff: ${data.plaintiffName}\nDefendant: ${data.defendantName}\n\nView at: ${caseLink}`,
    },

    hearing_scheduled: {
      subject: `Hearing Scheduled: ${data.caseNumber || ""}`,
      html: `
        <h2>Hearing Scheduled</h2>
        <p>A hearing has been scheduled for case <strong>${data.caseNumber}</strong>.</p>
        <p><strong>Date:</strong> ${data.hearingDate}</p>
        ${data.hearingTime ? `<p><strong>Time:</strong> ${data.hearingTime}</p>` : ""}
        ${data.judgeName ? `<p><strong>Presiding Officer:</strong> ${data.judgeName}</p>` : ""}
        <p>Please ensure you are present at the scheduled time.</p>
        <p><a href="${caseLink}">View Hearing Details</a></p>
      `,
      text: `Hearing Scheduled\n\nCase ${data.caseNumber}\nDate: ${data.hearingDate}${data.hearingTime ? `\nTime: ${data.hearingTime}` : ""}${data.judgeName ? `\nPresiding Officer: ${data.judgeName}` : ""}\n\nView at: ${caseLink}`,
    },

    hearing_reminder: {
      subject: `Hearing Reminder: Tomorrow at ${data.hearingTime || "scheduled time"}`,
      html: `
        <h2>Hearing Reminder</h2>
        <p>This is a reminder that you have a hearing <strong>tomorrow</strong> for case <strong>${data.caseNumber}</strong>.</p>
        <p><strong>Date:</strong> ${data.hearingDate}</p>
        ${data.hearingTime ? `<p><strong>Time:</strong> ${data.hearingTime}</p>` : ""}
        <p>Please be present on time.</p>
        <p><a href="${caseLink}">View Case Details</a></p>
      `,
      text: `Hearing Reminder\n\nHearing tomorrow for case ${data.caseNumber}\nDate: ${data.hearingDate}${data.hearingTime ? `\nTime: ${data.hearingTime}` : ""}\n\nView at: ${caseLink}`,
    },

    scrutiny_approved: {
      subject: `Case Approved: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Scrutiny Approved</h2>
        <p>Your case <strong>${data.caseNumber}</strong> has been approved by the Admin Court.</p>
        ${data.remarks ? `<p><strong>Court Remarks:</strong> ${data.remarks}</p>` : ""}
        <p>The case will now proceed to the next phase.</p>
        <p><a href="${caseLink}">View Case Status</a></p>
      `,
      text: `Case Scrutiny Approved\n\nCase ${data.caseNumber} approved by Admin Court.${data.remarks ? `\nRemarks: ${data.remarks}` : ""}\n\nView at: ${caseLink}`,
    },

    order_issued: {
      subject: `Court Order Issued: ${data.caseNumber || ""}`,
      html: `
        <h2>Court Order Issued</h2>
        <p>A new court order has been issued for case <strong>${data.caseNumber}</strong>.</p>
        ${data.orderText ? `<p><strong>Order:</strong></p><blockquote>${data.orderText}</blockquote>` : ""}
        <p><a href="${caseLink}">View Full Order</a></p>
      `,
      text: `Court Order Issued\n\nNew order for case ${data.caseNumber}.${data.orderText ? `\n\nOrder: ${data.orderText}` : ""}\n\nView at: ${caseLink}`,
    },

    judgment_delivered: {
      subject: `Judgment Delivered: ${data.caseNumber || ""}`,
      html: `
        <h2>Judgment Delivered</h2>
        <p>The court has delivered judgment for case <strong>${data.caseNumber}</strong>.</p>
        ${data.judgmentSummary ? `<p><strong>Summary:</strong></p><p>${data.judgmentSummary}</p>` : ""}
        <p>Please review the complete judgment document.</p>
        <p><a href="${caseLink}">View Judgment</a></p>
      `,
      text: `Judgment Delivered\n\nJudgment delivered for case ${data.caseNumber}.${data.judgmentSummary ? `\n\nSummary: ${data.judgmentSummary}` : ""}\n\nView at: ${caseLink}`,
    },

    case_transferred: {
      subject: `Case Transferred: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Transferred to Trial Court</h2>
        <p>Case <strong>${data.caseNumber}</strong> has been transferred to the Trial Court.</p>
        ${data.judgeName ? `<p><strong>Trial Judge:</strong> ${data.judgeName}</p>` : ""}
        <p>The trial proceedings will begin shortly.</p>
        <p><a href="${caseLink}">View Case Status</a></p>
      `,
      text: `Case Transferred\n\nCase ${data.caseNumber} transferred to Trial Court.${data.judgeName ? `\nTrial Judge: ${data.judgeName}` : ""}\n\nView at: ${caseLink}`,
    },

    case_stayed: {
      subject: `Case Stayed: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Proceedings Stayed</h2>
        <p>Proceedings for case <strong>${data.caseNumber}</strong> have been temporarily stayed.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
        <p>You will be notified when proceedings resume.</p>
        <p><a href="${caseLink}">View Case Status</a></p>
      `,
      text: `Case Proceedings Stayed\n\nCase ${data.caseNumber} stayed.${data.reason ? `\nReason: ${data.reason}` : ""}\n\nView at: ${caseLink}`,
    },

    case_withdrawn: {
      subject: `Case Withdrawn: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Withdrawn</h2>
        <p>Case <strong>${data.caseNumber}</strong> has been withdrawn.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
        <p>No further proceedings will take place.</p>
        <p><a href="${caseLink}">View Case File</a></p>
      `,
      text: `Case Withdrawn\n\nCase ${data.caseNumber} withdrawn.${data.reason ? `\nReason: ${data.reason}` : ""}\n\nView at: ${caseLink}`,
    },

    case_disposed: {
      subject: `Case Disposed: ${data.caseNumber || ""}`,
      html: `
        <h2>Case Disposed</h2>
        <p>Case <strong>${data.caseNumber}</strong> has been disposed of by the court.</p>
        ${data.remarks ? `<p><strong>Remarks:</strong> ${data.remarks}</p>` : ""}
        <p><a href="${caseLink}">View Case File</a></p>
      `,
      text: `Case Disposed\n\nCase ${data.caseNumber} disposed.${data.remarks ? `\nRemarks: ${data.remarks}` : ""}\n\nView at: ${caseLink}`,
    },

    bail_decision: {
      subject: `Bail Decision: ${data.caseNumber || ""}`,
      html: `
        <h2>Bail Application Decision</h2>
        <p>A decision has been made on the bail application for case <strong>${data.caseNumber}</strong>.</p>
        ${data.message ? `<p><strong>Decision:</strong> ${data.message}</p>` : ""}
        ${data.remarks ? `<p><strong>Remarks:</strong> ${data.remarks}</p>` : ""}
        <p><a href="${caseLink}">View Full Decision</a></p>
      `,
      text: `Bail Application Decision\n\nDecision for case ${data.caseNumber}.${data.message ? `\nDecision: ${data.message}` : ""}${data.remarks ? `\nRemarks: ${data.remarks}` : ""}\n\nView at: ${caseLink}`,
    },

    evidence_uploaded: {
      subject: `New Evidence Added: ${data.caseNumber || ""}`,
      html: `
        <h2>New Evidence Uploaded</h2>
        <p>New evidence has been uploaded for case <strong>${data.caseNumber}</strong>.</p>
        ${data.message ? `<p>${data.message}</p>` : ""}
        <p>Please review the evidence in the case file.</p>
        <p><a href="${caseLink}">View Evidence</a></p>
      `,
      text: `New Evidence Uploaded\n\nNew evidence for case ${data.caseNumber}.${data.message ? `\n${data.message}` : ""}\n\nView at: ${caseLink}`,
    },

    witness_summoned: {
      subject: `Witness Summons: ${data.caseNumber || ""}`,
      html: `
        <h2>Witness Summons</h2>
        <p>You have been summoned as a witness for case <strong>${data.caseNumber}</strong>.</p>
        ${data.hearingDate ? `<p><strong>Appearance Date:</strong> ${data.hearingDate}</p>` : ""}
        ${data.hearingTime ? `<p><strong>Time:</strong> ${data.hearingTime}</p>` : ""}
        <p>Your presence is mandatory.</p>
        <p><a href="${caseLink}">View Summons Details</a></p>
      `,
      text: `Witness Summons\n\nYou are summoned as witness for case ${data.caseNumber}.${data.hearingDate ? `\nDate: ${data.hearingDate}` : ""}${data.hearingTime ? `\nTime: ${data.hearingTime}` : ""}\n\nView at: ${caseLink}`,
    },

    appeal_filed: {
      subject: `Appeal Filed: ${data.caseNumber || ""}`,
      html: `
        <h2>Appeal Filed</h2>
        <p>An appeal has been filed against the judgment in case <strong>${data.caseNumber}</strong>.</p>
        ${data.message ? `<p>${data.message}</p>` : ""}
        <p><a href="${caseLink}">View Appeal Details</a></p>
      `,
      text: `Appeal Filed\n\nAppeal filed for case ${data.caseNumber}.${data.message ? `\n${data.message}` : ""}\n\nView at: ${caseLink}`,
    },
  };

  return templates[template];
}

/**
 * Utility to get email addresses for all parties involved in a case.
 * Returns an object with arrays of emails for each role.
 */
export interface CaseParticipants {
  plaintiffEmail?: string;
  defendantEmail?: string;
  plaintiffLawyerEmails: string[];
  defendantLawyerEmails: string[];
  judgeEmail?: string;
  adminCourtEmails: string[];
  magistrateEmails: string[];
  stenographerEmail?: string;
}

/**
 * Helper to send emails to multiple case participants at once.
 * Useful for events that notify all parties (e.g., hearing scheduled).
 */
export async function sendToParties(
  participants: CaseParticipants,
  template: EmailTemplate,
  data: EmailData,
  options?: {
    includePlaintiff?: boolean;
    includeDefendant?: boolean;
    includeLawyers?: boolean;
    includeJudge?: boolean;
    includeAdminCourt?: boolean;
    includeMagistrate?: boolean;
    includeStenographer?: boolean;
  }
): Promise<void> {
  const {
    includePlaintiff = true,
    includeDefendant = true,
    includeLawyers = true,
    includeJudge = true,
    includeAdminCourt = false,
    includeMagistrate = false,
    includeStenographer = false,
  } = options || {};

  const recipients: string[] = [];

  if (includePlaintiff && participants.plaintiffEmail) {
    recipients.push(participants.plaintiffEmail);
  }

  if (includeDefendant && participants.defendantEmail) {
    recipients.push(participants.defendantEmail);
  }

  if (includeLawyers) {
    recipients.push(...participants.plaintiffLawyerEmails, ...participants.defendantLawyerEmails);
  }

  if (includeJudge && participants.judgeEmail) {
    recipients.push(participants.judgeEmail);
  }

  if (includeAdminCourt) {
    recipients.push(...participants.adminCourtEmails);
  }

  if (includeMagistrate) {
    recipients.push(...participants.magistrateEmails);
  }

  if (includeStenographer && participants.stenographerEmail) {
    recipients.push(participants.stenographerEmail);
  }

  // Remove duplicates
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

  if (uniqueRecipients.length > 0) {
    await sendCaseEmail({
      to: uniqueRecipients,
      template,
      data,
    });
  }
}
