# Email Integration Guide

This guide shows how to configure Gmail SMTP and integrate email notifications into the Civilex application.

---

## 🔧 Gmail SMTP Configuration

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (required for App Passwords)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Civilex"
4. Click **Generate**
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure Environment Variables
Add these to your `.env.local` file:

```env
# Email Configuration (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # Paste the 16-char password here (spaces are OK)
EMAIL_FROM=Civilex <your-email@gmail.com>
ENABLE_EMAILS=true  # Set to false to disable emails in development
```

### Step 4: Test the Configuration
Run the app and trigger any email-sending action (e.g., lawyer accepting a case). Check the terminal for email logs:
```
[EMAIL] Sent successfully: { to: ['user@example.com'], template: 'case_accepted', subject: 'Lawyer Accepted Your Case: CIV-2026-0001' }
```

---

## 📧 Email Integration Patterns

This section shows how to integrate email notifications into existing hooks.

## Pattern 1: Notify Single User (Lawyer Accepts Case)

**File**: `src/hooks/useCases.ts` → `acceptCase()` function

**Before** (line ~353):
```typescript
// Notify client
const { data: caseData } = await supabase
  .from("cases")
  .select("plaintiff_id, defendant_id")
  .eq("id", caseId)
  .single();

if (caseData) {
  const clientId = caseData.plaintiff_id || caseData.defendant_id;
  if (clientId && clientId !== user.id) {
    await sendNotification(supabase, {
      userId: clientId,
      title: "Lawyer Accepted Your Case",
      message: `${lawyerName || "A lawyer"} has accepted your case.`,
      type: "case_assignment",
      referenceType: "case",
      referenceId: caseId,
    });
  }
}
```

**After** (with email):
```typescript
// Notify client + send email
const { data: caseData } = await supabase
  .from("cases")
  .select(`
    plaintiff_id,
    defendant_id,
    case_number,
    title,
    plaintiff:profiles!plaintiff_id(email, full_name),
    defendant:profiles!defendant_id(email, full_name)
  `)
  .eq("id", caseId)
  .single();

if (caseData) {
  const clientId = caseData.plaintiff_id || caseData.defendant_id;
  const clientProfile = caseData.plaintiff || caseData.defendant;
  
  if (clientId && clientId !== user.id && clientProfile?.email) {
    await sendNotificationWithEmail(supabase, {
      // In-app notification
      userId: clientId,
      title: "Lawyer Accepted Your Case",
      message: `${lawyerName || "A lawyer"} has accepted your case.`,
      type: "case_assignment",
      referenceType: "case",
      referenceId: caseId,
      
      // Email notification
      userEmail: clientProfile.email,
      emailTemplate: "case_accepted",
      emailData: {
        caseNumber: caseData.case_number,
        caseTitle: caseData.title,
        lawyerName: lawyerName || "Your assigned lawyer",
        caseLink: `/cases/${caseId}`,
        nextStep: "Please proceed with fee payment to begin case proceedings.",
      },
    });
  }
}
```

**Import to add at top of file**:
```typescript
import { sendNotificationWithEmail } from "@/lib/helpers/notificationWithEmail";
```

---

## Pattern 2: Notify Multiple Recipients (Hearing Scheduled)

**File**: `src/hooks/useHearings.ts` → `createHearing()` function

**Before** (line ~133):
```typescript
// Send notifications to all parties
for (const pid of participantIds) {
  if (pid !== user.id) {
    await sendNotification(supabase, {
      userId: pid,
      title: "Hearing Scheduled",
      message: `A hearing has been scheduled for ${formattedDate}`,
      type: "hearing_scheduled",
      referenceType: "hearing",
      referenceId: newHearing.id,
    });
  }
}
```

**After** (with emails):
```typescript
// Get participant emails
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, email, full_name")
  .in("id", participantIds);

const profileMap = new Map(
  (profiles || []).map(p => [p.id, { email: p.email, name: p.full_name }])
);

// Build notification payloads
const notifications = participantIds
  .filter(pid => pid !== user.id && profileMap.has(pid))
  .map(pid => {
    const profile = profileMap.get(pid)!;
    return {
      // In-app notification
      userId: pid,
      title: "Hearing Scheduled",
      message: `A hearing has been scheduled for ${formattedDate}`,
      type: "hearing_scheduled" as const,
      referenceType: "hearing" as const,
      referenceId: newHearing.id,
      
      // Email notification
      userEmail: profile.email,
      emailTemplate: "hearing_scheduled" as const,
      emailData: {
        caseNumber: caseData.case_number,
        caseTitle: caseData.title,
        hearingDate: formattedDate,
        hearingTime: formattedTime,
        caseLink: `/cases/${caseId}`,
        nextStep: "Please be present at the court on the scheduled date and time.",
      },
    };
  });

// Send all notifications + emails in batch
await sendNotificationsWithEmails(supabase, notifications);
```

**Import to add**:
```typescript
import { sendNotificationsWithEmails } from "@/lib/helpers/notificationWithEmail";
```

---

## Pattern 3: Email All Case Participants (Judgment Delivered)

**File**: `src/hooks/useJudgment.ts` → `deliverJudgment()` function

**Before**:
```typescript
// Update case status to judgment_delivered
await supabase
  .from("cases")
  .update({ status: "judgment_delivered" })
  .eq("id", caseId);

// Send notifications...
```

**After** (with emails to all parties):
```typescript
// Update case status
await supabase
  .from("cases")
  .update({ status: "judgment_delivered" })
  .eq("id", caseId);

// Get all case participants
const participants = await getCaseParticipantEmails(supabase, caseId);

// Get case details
const { data: caseData } = await supabase
  .from("cases")
  .select("case_number, title")
  .eq("id", caseId)
  .single();

if (caseData) {
  // Prepare email recipients
  const recipients: string[] = [];
  
  if (participants.plaintiffEmail) recipients.push(participants.plaintiffEmail);
  if (participants.defendantEmail) recipients.push(participants.defendantEmail);
  recipients.push(...participants.lawyerEmails.map(l => l.email));
  
  // Send email to all parties
  if (recipients.length > 0) {
    await sendCaseEmail({
      to: recipients,
      template: "judgment_delivered",
      data: {
        caseNumber: caseData.case_number,
        caseTitle: caseData.title,
        judgmentSummary: judgmentText.substring(0, 200) + "...",
        caseLink: `/cases/${caseId}`,
        nextStep: "You can view the complete judgment in the case details.",
      },
    });
  }
}
```

**Imports to add**:
```typescript
import { getCaseParticipantEmails } from "@/lib/helpers/notificationWithEmail";
import { sendCaseEmail } from "@/lib/services/email";
```

---

## Pattern 4: Email Court Officials (Case Submitted to Admin)

**File**: `src/hooks/useCases.ts` → `submitToAdmin()` function

**Before**:
```typescript
// Update case status
await supabase
  .from("cases")
  .update({ status: "submitted_to_admin" })
  .eq("id", caseId);

// Maybe notify admin court...
```

**After** (email all admin court officials):
```typescript
// Update case status
await supabase
  .from("cases")
  .update({ status: "submitted_to_admin" })
  .eq("id", caseId);

// Get case details
const { data: caseData } = await supabase
  .from("cases")
  .select("case_number, title")
  .eq("id", caseId)
  .single();

// Get all admin court officials
const adminEmails = await getAdminCourtEmails(supabase);

// Send email to all admin court staff
if (adminEmails.length > 0 && caseData) {
  await sendCaseEmail({
    to: adminEmails,
    template: "case_submitted",
    data: {
      caseNumber: caseData.case_number,
      caseTitle: caseData.title,
      caseLink: `/cases/${caseId}`,
      nextStep: "Please review the case documents and proceed with scrutiny.",
    },
  });
}
```

**Imports to add**:
```typescript
import { getAdminCourtEmails } from "@/lib/helpers/notificationWithEmail";
import { sendCaseEmail } from "@/lib/services/email";
```

---

## Pattern 5: Payment Reminders & Confirmations

**File**: `src/hooks/usePayments.ts` → `simulatePayment()` function

**After payment succeeds**:
```typescript
// Get payer email
const { data: profile } = await supabase
  .from("profiles")
  .select("email, full_name")
  .eq("id", user.id)
  .single();

// Get case details
const { data: payment } = await supabase
  .from("payments")
  .select(`
    amount,
    case:cases(case_number, title)
  `)
  .eq("id", paymentId)
  .single();

if (profile?.email && payment?.case) {
  await sendNotificationWithEmail(supabase, {
    userId: user.id,
    title: "Payment Received",
    message: `Payment of Rs. ${payment.amount} has been received.`,
    type: "payment",
    referenceType: "payment",
    referenceId: paymentId,
    
    userEmail: profile.email,
    emailTemplate: "payment_received",
    emailData: {
      caseNumber: payment.case.case_number,
      caseTitle: payment.case.title,
      amount: `Rs. ${payment.amount}`,
      caseLink: `/cases/${caseId}`,
      nextStep: "Your case will now proceed to the next stage.",
    },
  });
}
```

---

## Complete Integration Checklist

### Core Case Flow Events
- [ ] **Case Assigned** - `useCases.ts` → `createCase()` - Notify assigned lawyer
- [ ] **Lawyer Accepts** - `useCases.ts` → `acceptCase()` - Notify client
- [ ] **Lawyer Declines** - `useCases.ts` → `declineCase()` - Notify client with reason
- [ ] **Payment Received** - `usePayments.ts` → `simulatePayment()` - Notify payer
- [ ] **Case Submitted** - `useCases.ts` → `submitToAdmin()` - Email all admin court officials
- [ ] **Scrutiny Result** - `useScrutiny.ts` → `approveScrutiny()` / `returnScrutiny()` - Email client & lawyers
- [ ] **Case Registered** - When admin court registers case - Email all parties
- [ ] **Summon Issued** - When defendant summon is issued - Email defendant

### Hearing Events
- [ ] **Hearing Scheduled** - `useHearings.ts` → `createHearing()` - Email all parties (plaintiff, defendant, lawyers, judge)
- [ ] **Hearing Reminder** - Scheduled job (future) - Send 24h before hearing
- [ ] **Hearing Updated** - `useHearings.ts` → `updateHearing()` - Email all parties

### Trial & Judgment
- [ ] **Evidence Uploaded** - `useEvidence.ts` → `uploadEvidence()` - Email opposing party & their lawyer
- [ ] **Witness Summoned** - `useWitnesses.ts` → `issueWitnessSummons()` - Email witness
- [ ] **Order Issued** - `useCaseIssues.ts` → `issueOrder()` - Email all parties
- [ ] **Judgment Reserved** - When case status → reserved_for_judgment - Email all parties
- [ ] **Judgment Delivered** - `useJudgment.ts` → `deliverJudgment()` - Email all parties with summary

### Administrative
- [ ] **Case Transferred** - When case transferred to trial court - Email magistrates
- [ ] **Case Stayed** - When case is stayed - Email all parties
- [ ] **Case Withdrawn** - When client withdraws case - Email all parties
- [ ] **Case Disposed** - When case is disposed - Email all parties

### Criminal-Specific
- [ ] **Bail Application** - `useBailApplications.ts` → `submitBailApplication()` - Email judge & prosecutor
- [ ] **Bail Decision** - `useBailApplications.ts` → `decideBail()` - Email accused & their lawyer
- [ ] **FIR Filed** - When criminal case created - Email investigating officer

### Appeals
- [ ] **Appeal Filed** - `useAppeals.ts` → `fileAppeal()` - Email opposing party

---

## Testing Strategy

### 1. Development Testing
```env
# .env
ENABLE_EMAILS=true
RESEND_API_KEY=re_test_key
EMAIL_FROM=test@resend.dev
```

Use test addresses:
- `delivered@resend.dev` - Always succeeds
- `bounced@resend.dev` - Always bounces
- `complained@resend.dev` - Always complaints

### 2. Smoke Test
Create a test script:
```typescript
// scripts/test-email.ts
import { sendCaseEmail } from "@/lib/services/email";

await sendCaseEmail({
  to: "delivered@resend.dev",
  template: "case_accepted",
  data: {
    caseNumber: "TEST/2024/001",
    caseTitle: "Test Case",
    lawyerName: "Test Lawyer",
    caseLink: "/cases/test",
  },
});

console.log("✅ Test email sent!");
```

### 3. Integration Test
1. Create a test case
2. Assign a lawyer
3. Accept as lawyer
4. Check that:
   - In-app notification appears
   - Email appears in Resend dashboard
   - Email content is correct

---

## Performance Considerations

1. **Batch Operations**: Use `sendNotificationsWithEmails()` for multiple recipients
2. **Fire-and-Forget**: Email sending doesn't block main operations
3. **Rate Limits**: Resend free tier = 100 emails/day
4. **Template Reuse**: Templates are cached, no performance hit

---

## Deployment Notes

### Before Production
1. ✅ Verify domain in Resend
2. ✅ Update `EMAIL_FROM` to verified domain
3. ✅ Set production `RESEND_API_KEY`
4. ✅ Set production `NEXT_PUBLIC_APP_URL`
5. ✅ Test all email templates
6. ✅ Monitor Resend dashboard for bounces

### Environment Variables
```env
# Production .env
RESEND_API_KEY=re_prod_xxxxx
EMAIL_FROM=Civilex <noreply@civilex.pk>
NEXT_PUBLIC_APP_URL=https://civilex.pk
```

---

**Last Updated**: April 25, 2026
