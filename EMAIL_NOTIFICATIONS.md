# Email Notification System

## Overview
Civilex includes a comprehensive email notification system that automatically sends emails to all relevant parties (Plaintiff, Defendant, Lawyers, Judges, Admin Court, Magistrates) whenever important case events occur.

## Features
- ✉️ **Automated Emails**: Sends emails for 22+ case events
- 👥 **Multi-Party**: Notifies all relevant parties automatically
- 📧 **Dual Notifications**: In-app + email for better reach
- 🎨 **Professional Templates**: HTML emails with proper formatting
- ⚡ **Non-Blocking**: Email failures don't block operations
- 🔧 **Easy Integration**: Simple API for developers

## Setup

### 1. Install Dependencies
```bash
npm install resend
```

### 2. Get Resend API Key
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Create an API key
4. Add your domain or use test mode

### 3. Configure Environment Variables
Add to your `.env` file:

```env
# Resend API Key (required for email sending)
RESEND_API_KEY=re_your_api_key_here

# Sender email address (must be verified domain in Resend)
EMAIL_FROM=Civilex <noreply@civilex.pk>

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Enable emails in development (default: disabled)
ENABLE_EMAILS=true
```

### 4. Verify Your Domain (Production)
For production, verify your domain in Resend:
1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., civilex.pk)
3. Add DNS records (TXT, CNAME) as shown
4. Wait for verification (usually instant)

## Email Templates

The system includes 22 pre-built email templates:

### Case Management
- `case_assigned` - Lawyer assigned to case
- `case_accepted` - Lawyer accepted case
- `case_declined` - Lawyer declined case
- `case_submitted` - Case submitted to admin court
- `case_returned` - Case returned for revision
- `case_registered` - Case officially registered
- `case_transferred` - Transferred to trial court
- `case_stayed` - Case proceedings stayed
- `case_withdrawn` - Case withdrawn
- `case_disposed` - Case disposed

### Payments
- `payment_reminder` - Payment due reminder
- `payment_received` - Payment confirmed

### Hearings
- `hearing_scheduled` - Hearing scheduled
- `hearing_reminder` - 24h before hearing
- `summon_issued` - Court summon issued

### Court Orders
- `scrutiny_approved` - Admin court approved
- `order_issued` - Court order issued
- `judgment_delivered` - Final judgment

### Criminal Cases
- `bail_decision` - Bail granted/denied
- `witness_summoned` - Witness summons

### Evidence & Appeals
- `evidence_uploaded` - New evidence added
- `appeal_filed` - Appeal filed

## Usage

### Method 1: Simple Email (Single Recipient)

```typescript
import { sendCaseEmail } from "@/lib/services/email";

await sendCaseEmail({
  to: "user@example.com",
  template: "case_accepted",
  data: {
    caseNumber: "CIVIL/2024/001",
    caseTitle: "Property Dispute",
    lawyerName: "Advocate Ali Khan",
    feeAmount: "Rs. 50,000",
    caseLink: "/cases/abc123",
  },
});
```

### Method 2: Notification + Email (Recommended)

```typescript
import { sendNotificationWithEmail } from "@/lib/helpers/notificationWithEmail";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

await sendNotificationWithEmail(supabase, {
  // In-app notification fields
  userId: targetUserId,
  title: "Hearing Scheduled",
  message: "A hearing has been scheduled for your case.",
  type: "hearing_scheduled",
  referenceType: "case",
  referenceId: caseId,
  
  // Email fields
  userEmail: "user@example.com",
  emailTemplate: "hearing_scheduled",
  emailData: {
    caseNumber: "CIVIL/2024/001",
    caseTitle: "Property Dispute",
    hearingDate: "May 15, 2024",
    hearingTime: "10:00 AM",
    judgeName: "Hon'ble Justice Ahmed",
    caseLink: "/cases/abc123",
  },
});
```

### Method 3: Batch Notifications + Emails

```typescript
import { sendNotificationsWithEmails } from "@/lib/helpers/notificationWithEmail";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

await sendNotificationsWithEmails(supabase, [
  {
    userId: plaintiffId,
    userEmail: "plaintiff@example.com",
    title: "Hearing Scheduled",
    message: "Hearing scheduled for May 15",
    type: "hearing_scheduled",
    emailTemplate: "hearing_scheduled",
    emailData: { caseNumber, hearingDate: "May 15, 2024" },
  },
  {
    userId: defendantId,
    userEmail: "defendant@example.com",
    title: "Hearing Scheduled",
    message: "Hearing scheduled for May 15",
    type: "hearing_scheduled",
    emailTemplate: "hearing_scheduled",
    emailData: { caseNumber, hearingDate: "May 15, 2024" },
  },
]);
```

### Method 4: Email All Case Participants

```typescript
import { sendToParties, type CaseParticipants } from "@/lib/services/email";
import { getCaseParticipantEmails } from "@/lib/helpers/notificationWithEmail";

const participants: CaseParticipants = await getCaseParticipantEmails(supabase, caseId);

await sendToParties(
  participants,
  "hearing_scheduled",
  {
    caseNumber: "CIVIL/2024/001",
    hearingDate: "May 15, 2024",
    hearingTime: "10:00 AM",
  },
  {
    includePlaintiff: true,
    includeDefendant: true,
    includeLawyers: true,
    includeJudge: true,
  }
);
```

## Email Data Fields

Each template accepts different data fields:

```typescript
interface EmailData {
  // Common fields (most templates)
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
}
```

## Integration Points

### Where to Add Email Notifications

#### 1. **Case Assignment** (when lawyer is assigned)
File: `src/hooks/useCases.ts` → `createCase()`
```typescript
// After creating assignment
await sendNotificationWithEmail(supabase, {
  userId: lawyerId,
  userEmail: lawyerEmail,
  title: "New Case Assignment",
  message: `You have been assigned to case ${caseNumber}`,
  type: "case_assignment",
  emailTemplate: "case_assigned",
  emailData: { caseNumber, caseTitle, plaintiffName },
});
```

#### 2. **Lawyer Accepts Case**
File: `src/hooks/useCases.ts` → `acceptCase()`
```typescript
// Notify client
await sendNotificationWithEmail(supabase, {
  userId: clientId,
  userEmail: clientEmail,
  title: "Lawyer Accepted Your Case",
  message: `${lawyerName} has accepted your case`,
  type: "case_accepted",
  emailTemplate: "case_accepted",
  emailData: { caseNumber, lawyerName, feeAmount: `Rs. ${feeAmount}` },
});
```

#### 3. **Payment Received**
File: `src/hooks/usePayments.ts` → `simulatePayment()`
```typescript
await sendNotificationWithEmail(supabase, {
  userId: payerId,
  userEmail: payerEmail,
  title: "Payment Received",
  message: `Payment of Rs. ${amount} received`,
  type: "payment",
  emailTemplate: "payment_received",
  emailData: { caseNumber, amount: `Rs. ${amount}` },
});
```

#### 4. **Case Submitted to Admin Court**
File: `src/hooks/useCases.ts` → `submitToAdmin()`
```typescript
// Get all admin court officials
const adminEmails = await getAdminCourtEmails(supabase);

for (const email of adminEmails) {
  await sendCaseEmail({
    to: email,
    template: "case_submitted",
    data: { caseNumber, caseTitle },
  });
}
```

#### 5. **Hearing Scheduled**
File: `src/hooks/useHearings.ts` → `createHearing()`
```typescript
// Get all case participants
const participants = await getCaseParticipantEmails(supabase, caseId);

await sendToParties(
  participants,
  "hearing_scheduled",
  {
    caseNumber,
    hearingDate: formatDate(hearing.scheduled_at),
    hearingTime: formatTime(hearing.scheduled_at),
    judgeName: judgeName,
  },
  {
    includePlaintiff: true,
    includeDefendant: true,
    includeLawyers: true,
    includeJudge: false, // Judge already knows
  }
);
```

#### 6. **Judgment Delivered**
File: `src/hooks/useJudgment.ts` → `deliverJudgment()`
```typescript
const participants = await getCaseParticipantEmails(supabase, caseId);

await sendToParties(
  participants,
  "judgment_delivered",
  {
    caseNumber,
    judgmentSummary: judgment.summary,
  },
  {
    includePlaintiff: true,
    includeDefendant: true,
    includeLawyers: true,
  }
);
```

## Development vs Production

### Development Mode
- Emails are **disabled by default** to avoid spam during testing
- Set `ENABLE_EMAILS=true` in `.env` to test emails locally
- All email attempts are logged to console

### Production Mode
- Emails are **enabled automatically**
- Requires valid `RESEND_API_KEY`
- Failed emails are logged but don't block operations

## Testing

### 1. Test in Development
```env
ENABLE_EMAILS=true
RESEND_API_KEY=re_test_key
EMAIL_FROM=test@resend.dev
```

### 2. Use Resend Test Mode
Resend provides test email addresses that don't send real emails:
```typescript
await sendCaseEmail({
  to: "delivered@resend.dev", // Always succeeds
  template: "case_accepted",
  data: { caseNumber: "TEST/001" },
});
```

### 3. Check Resend Dashboard
View all sent emails, delivery status, and logs at:
https://resend.com/emails

## Error Handling

Emails are sent in a **fire-and-forget** manner:
- Email failures **never block** primary operations
- Errors are logged to console in development
- In-app notifications still work even if emails fail

```typescript
// This will never throw, even if email fails
await sendNotificationWithEmail(supabase, {
  // ... notification data
});
// Code continues here regardless of email outcome
```

## Cost

### Free Tier (Resend)
- 100 emails/day
- 3,000 emails/month
- Perfect for testing and small deployments

### Paid Plans
- $20/month: 50,000 emails/month
- $80/month: 500,000 emails/month

For an FYP, the free tier is sufficient!

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   echo $RESEND_API_KEY  # Should not be empty
   ```

2. **Check Domain Verification**
   - Production: Domain must be verified in Resend
   - Development: Use test email addresses

3. **Check Logs**
   - Development: Check terminal console
   - Production: Check Resend dashboard

4. **Test Connection**
   ```typescript
   const resend = new Resend(process.env.RESEND_API_KEY);
   const result = await resend.emails.send({
     from: "test@resend.dev",
     to: "delivered@resend.dev",
     subject: "Test",
     html: "<p>Test email</p>",
   });
   console.log(result);
   ```

### Common Issues

**"Domain not verified"**
- Add DNS records shown in Resend dashboard
- Wait up to 72 hours for propagation

**"Invalid API key"**
- Regenerate key in Resend dashboard
- Update `.env` file
- Restart dev server

**"Rate limit exceeded"**
- Free tier: 100/day limit
- Upgrade plan or wait for reset

## Security

### Best Practices
1. **Never expose API key**: Keep in `.env`, never commit to git
2. **Use verified domains**: Don't use free email addresses in production
3. **Validate recipient emails**: Check format before sending
4. **Rate limiting**: Don't send more than necessary
5. **Unsubscribe**: Add unsubscribe option for recurring emails

### GDPR Compliance
- Users' emails are only used for case notifications
- No marketing emails are sent
- Users can't unsubscribe from legal notifications (required by law)

## Future Enhancements

Potential improvements for production:
- [ ] Email templates with React Email for better design
- [ ] Email tracking (open rates, click rates)
- [ ] SMS notifications for urgent updates
- [ ] Scheduled email reminders (hearing day -1, payment due)
- [ ] Email preferences per user
- [ ] Bulk email for announcements
- [ ] Attachment support (PDF orders, judgments)

---

**Documentation Last Updated**: April 25, 2026
