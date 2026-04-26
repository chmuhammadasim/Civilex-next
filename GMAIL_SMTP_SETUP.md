# 📧 Gmail SMTP Setup Instructions for Civilex

The email system has been successfully migrated from Resend to Gmail SMTP using nodemailer.

## ✅ Changes Made

1. **Installed nodemailer** - Email client for Gmail SMTP
2. **Updated email service** - `src/lib/services/email.ts` now uses Gmail instead of Resend
3. **Removed Resend** - Uninstalled the resend package
4. **Updated documentation** - README.md and EMAIL_INTEGRATION_GUIDE.md now reflect Gmail SMTP

---

## 🔧 Setup Steps (IMPORTANT - Follow These!)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** (this is required to generate App Passwords)

### Step 2: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Type **Civilex** as the custom name
6. Click **Generate**
7. **COPY** the 16-character password shown (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Update Your `.env.local` File

Open your `.env.local` file and add these variables:

```env
# Email Configuration (Gmail SMTP)
GMAIL_USER=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=Civilex <your-actual-email@gmail.com>
ENABLE_EMAILS=true
```

**Important Notes:**
- Replace `your-actual-email@gmail.com` with YOUR Gmail address
- Replace `xxxx xxxx xxxx xxxx` with the 16-char password from Step 2
- Spaces in the App Password are fine (nodemailer handles them)
- If you're in development and don't want emails, set `ENABLE_EMAILS=false`

### Step 4: Restart Your Development Server

After updating `.env.local`, restart the Next.js server:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

## 🧪 Testing the Email System

### Option 1: Use Your Real Gmail (Recommended for Testing)

This is the easiest way to test. Just use your personal Gmail:

```env
GMAIL_USER=yourname@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
EMAIL_FROM=Civilex <yourname@gmail.com>
```

**Pros:**
- Instant setup, no configuration needed
- Emails will actually be sent and delivered
- Good for development and FYP demonstrations

**Cons:**
- Sends from your personal email
- Daily sending limit: 500 emails/day

### Option 2: Create a Dedicated Gmail Account

Create a new Gmail account just for Civilex:

1. Go to: https://accounts.google.com/signup
2. Create account: `civilex.judiciary@gmail.com` (or any name)
3. Enable 2FA and generate App Password as described above
4. Use this dedicated account in `.env.local`

**Pros:**
- Professional sender address
- Keeps your personal email separate
- Same 500/day limit

### Test It

1. Start the app: `npm run dev`
2. Register as a client
3. Create a case and assign a lawyer
4. Have the lawyer accept the case
5. Check the terminal output:
   ```
   [EMAIL] Sent successfully: {
     to: ['client@example.com'],
     template: 'case_accepted',
     subject: 'Lawyer Accepted Your Case: CIV-2026-0001'
   }
   ```
6. Check the recipient's inbox (or your own if testing with your email)

---

## 📊 Email Templates Available

The system supports these 22 email templates:

1. `case_assigned` - Lawyer assigned to case
2. `case_accepted` - Lawyer accepted case
3. `case_declined` - Lawyer declined case
4. `payment_reminder` - Payment due reminder
5. `payment_received` - Payment confirmed
6. `case_submitted` - Case submitted to admin court
7. `case_returned` - Case returned for revision
8. `case_registered` - Case officially registered
9. `summon_issued` - Defendant summon issued
10. `hearing_scheduled` - Hearing scheduled notification
11. `hearing_reminder` - 24h before hearing
12. `scrutiny_approved` - Admin approved case
13. `order_issued` - Court order issued
14. `judgment_delivered` - Final judgment
15. `case_transferred` - Transferred to trial court
16. `case_stayed` - Case stayed/suspended
17. `case_withdrawn` - Case withdrawn
18. `case_disposed` - Case disposed
19. `bail_decision` - Bail granted/denied
20. `evidence_uploaded` - New evidence added
21. `witness_summoned` - Witness summons
22. `appeal_filed` - Appeal filed

All templates are professional, include relevant case details, and have both HTML and plain text versions.

---

## 🔍 Troubleshooting

### Issue: "Gmail credentials not configured"

**Solution:** Make sure `.env.local` has `GMAIL_USER` and `GMAIL_APP_PASSWORD` set correctly.

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Possible causes:**
1. App Password is incorrect - regenerate it
2. 2-Factor Authentication is not enabled - enable it first
3. You're using your regular Gmail password instead of App Password - use the 16-char App Password

### Issue: Emails not sending but no error

**Solution:** Check that `ENABLE_EMAILS=true` in `.env.local`. If set to `false`, emails are only logged but not sent.

### Issue: "Daily sending limit exceeded"

**Solution:** Gmail has a 500 emails/day limit for personal accounts. For production, consider:
- Google Workspace (2000/day limit)
- AWS SES, SendGrid, or Mailgun (higher limits)

---

## 🚀 Production Deployment

For production deployment (Vercel, Railway, etc.):

1. Add environment variables in your deployment platform:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   EMAIL_FROM=Civilex <your-email@gmail.com>
   ```

2. **DO NOT** commit `.env.local` to Git (it's already in `.gitignore`)

3. For higher volume, consider:
   - **Google Workspace** - 2000 emails/day
   - **AWS SES** - 200/day free tier, then pay-as-you-go
   - **SendGrid** - 100/day free tier
   - **Mailgun** - 100/day free tier

---

## 📝 Next Steps

1. Follow the setup steps above
2. Test the email system with a real case workflow
3. Check both terminal logs and actual email delivery
4. For your FYP demo, use a real Gmail account to demonstrate email notifications

Need help? Check [EMAIL_INTEGRATION_GUIDE.md](EMAIL_INTEGRATION_GUIDE.md) for integration examples.

---

**Migration Complete! ✅**

The email system is now powered by Gmail SMTP instead of Resend. All existing email templates and functionality remain the same.
