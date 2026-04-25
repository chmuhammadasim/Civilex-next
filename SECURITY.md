# Security Policy

## 🔒 Overview

Civilex is a judiciary management system handling sensitive legal data. This document outlines our security architecture, practices, and procedures for maintaining the confidentiality, integrity, and availability of the platform.

---

## 📋 Table of Contents

- [Security Features](#security-features)
- [Authentication & Authorization](#authentication--authorization)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Known Security Issues](#known-security-issues)
- [Vulnerability Reporting](#vulnerability-reporting)
- [Security Best Practices](#security-best-practices)
- [Compliance](#compliance)
- [Audit & Logging](#audit--logging)

---

## 🛡️ Security Features

### Core Security Layers

1. **Authentication**: JWT-based auth via Supabase Auth
2. **Authorization**: Role-based access control (6 roles)
3. **Row Level Security**: PostgreSQL RLS on all 18 tables
4. **API Security**: Server-side validation, rate limiting
5. **Data Encryption**: TLS in transit, encrypted at rest
6. **Audit Logging**: Complete activity tracking
7. **Input Validation**: Zod schemas on all inputs
8. **CSRF Protection**: Next.js built-in token validation
9. **XSS Prevention**: React automatic escaping
10. **SQL Injection Prevention**: Parameterized queries via Supabase

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
User Login → Supabase Auth → JWT Token → Session Cookie → Middleware Check
    ↓
Role Verification → Route Access → RLS Policy Applied
```

### Supported Authentication Methods

- **Email/Password**: Primary method with bcrypt hashing
- **Magic Links**: One-time passwordless login (optional)
- **OAuth**: Google, GitHub (can be enabled)
- **Session Management**: Auto-refresh tokens, 7-day expiry

### Password Requirements

```typescript
// Enforced via Supabase Auth settings
- Minimum length: 8 characters
- Complexity: Mix of letters, numbers (recommended)
- Rate limiting: 5 failed attempts = 5-minute lockout
- Password reset: Email-based secure token
```

### Role-Based Access Control (RBAC)

#### 6 User Roles

| Role | Permissions | Access Level |
|------|-------------|--------------|
| `client` | File cases, hire lawyers, view own cases | Limited |
| `lawyer` | Accept cases, draft documents, represent | Medium |
| `admin_court` | Scrutiny, registration, summons | High |
| `magistrate` | Bail, preliminary hearings, criminal cases | High |
| `trial_judge` | Trials, judgments, decrees | High |
| `stenographer` | Hearing transcripts, attendance | Limited |

#### Role Assignment

```typescript
// Set during registration via user_metadata
{
  "role": "lawyer",
  "bar_license_number": "LAH/BAR/2025/12345", // Lawyers only
  "specialization": ["Civil", "Criminal"]      // Lawyers only
}

// Role cannot be changed post-registration (prevents privilege escalation)
```

### Middleware Protection

```typescript
// middleware.ts - Route-based role verification
const roleRoutes = {
  client: ["/dashboard", "/cases", "/lawyers", "/payments"],
  lawyer: ["/dashboard", "/cases", "/ai-assistant"],
  admin_court: ["/dashboard", "/cases", "/cases/scrutiny"],
  // ... etc
};

// Unauthorized routes redirect to /dashboard
// Critical routes require specific roles (deny-list approach)
```

**Fixed Vulnerabilities:**
- ✅ **BUG-001**: Added role-based route protection (was missing entirely)
- ✅ **BUG-016**: Optimized to read role from `user_metadata` (no DB query per request)
- ✅ **BUG-017**: Changed to deny-list approach (allows shared routes like `/cases/{id}`)

---

## 🔒 Row Level Security (RLS)

### RLS Architecture

**All 18 tables** have RLS policies enforcing data access at the PostgreSQL level. Even if a malicious user bypasses client-side checks, the database blocks unauthorized queries.

### Policy Types

1. **SELECT**: Who can read rows
2. **INSERT**: Who can create rows
3. **UPDATE**: Who can modify rows
4. **DELETE**: Who can remove rows

### Example Policies

#### Cases Table

```sql
-- Clients can view cases they're involved in
CREATE POLICY "Clients can view their cases" ON cases
FOR SELECT
USING (
  auth.uid() = plaintiff_id 
  OR auth.uid() = defendant_id 
  OR EXISTS (
    SELECT 1 FROM case_assignments
    WHERE case_id = cases.id
    AND client_id = auth.uid()
  )
);

-- Lawyers can view assigned cases
CREATE POLICY "Lawyers can view assigned cases" ON cases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'lawyer'
  )
  AND EXISTS (
    SELECT 1 FROM case_assignments
    WHERE case_id = cases.id
    AND lawyer_id = auth.uid()
    AND status IN ('accepted', 'pending')
  )
);

-- Court officials can view all cases
CREATE POLICY "Court officials can view all cases" ON cases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin_court', 'magistrate', 'trial_judge')
  )
);
```

#### Documents Table

```sql
-- Only parties and their lawyers can view documents
CREATE POLICY "Parties can view case documents" ON documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = documents.case_id
    AND (
      c.plaintiff_id = auth.uid()
      OR c.defendant_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM case_assignments ca
        WHERE ca.case_id = c.id
        AND (ca.lawyer_id = auth.uid() OR ca.client_id = auth.uid())
        AND ca.status = 'accepted'
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin_court', 'magistrate', 'trial_judge')
  )
);
```

#### Payments Table

```sql
-- Only payer, receiver, and case parties can view payments
CREATE POLICY "Users can view their payments" ON payments
FOR SELECT
USING (
  payer_id = auth.uid()
  OR receiver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = payments.case_id
    AND (c.plaintiff_id = auth.uid() OR c.defendant_id = auth.uid())
  )
);

-- Lawyers can create payments for accepted cases
CREATE POLICY "Lawyers can create payments" ON payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'lawyer'
  )
);
```

### SECURITY DEFINER Functions

**Use Case**: Bypass RLS for automated operations (e.g., triggers)

```sql
-- Example: Auto-generate case numbers
CREATE OR REPLACE FUNCTION auto_generate_case_number()
RETURNS TRIGGER
SECURITY DEFINER  -- Runs with function owner's privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate case number using advisory lock
  -- (prevents race conditions)
  PERFORM pg_advisory_xact_lock(hashtext(NEW.case_type::TEXT));
  
  NEW.case_number := /* generation logic */;
  RETURN NEW;
END;
$$;
```

**Security Note**: `SECURITY DEFINER` functions must be carefully audited as they bypass RLS.

**Fixed Vulnerabilities:**
- ✅ **BUG-002**: Added `.select().maybeSingle()` to verify RLS updates succeeded
- ✅ **BUG-010**: Fixed RLS timing in `declineCase` (revert status before updating assignment)

---

## 🔐 Data Protection

### Encryption

#### In Transit
- **TLS 1.3**: All API calls encrypted via HTTPS
- **WebSocket**: Supabase Realtime uses WSS (encrypted)
- **Supabase Connection**: Enforced TLS for database connections

#### At Rest
- **Supabase Storage**: AES-256 encryption for document uploads
- **Database**: PostgreSQL data files encrypted (Supabase managed)
- **Backups**: Encrypted via Supabase automated backups

### Sensitive Data Handling

| Data Type | Storage | Protection |
|-----------|---------|-----------|
| Passwords | Supabase Auth | bcrypt hashing |
| Case Documents | Supabase Storage | Encrypted, RLS-controlled |
| Payment Info | PostgreSQL | RLS, no card data stored |
| Personal Info (CNIC, Phone) | profiles table | RLS, Zod validation |
| OTP Codes | otp_signatures table | 10-min expiry, one-time use |
| JWT Tokens | HTTP-only cookies | Auto-refresh, secure flag |

### Data Retention

- **Cases**: Permanent (archival system)
- **Activity Logs**: 5 years
- **Notifications**: 90 days (can be purged)
- **OTP Signatures**: Auto-delete after 10 minutes
- **Session Tokens**: 7-day expiry, auto-refresh

### Personal Data Protection

```typescript
// Zod validation ensures data format compliance
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().regex(/^03\d{9}$/).optional(), // Pakistani format
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/).optional(), // XXXXX-XXXXXXX-X
});
```

**Fixed Vulnerabilities:**
- ✅ **BUG-015**: Added CNIC/Phone format validation
- ✅ **BUG-018**: Added validation on settings update form

---

## 🔌 API Security

### Server-Side Validation

**All API routes** validate:
1. Authentication (session token)
2. Authorization (role check)
3. Input schema (Zod validation)
4. Rate limiting (per user/IP)

```typescript
// Example: /api/notifications/send/route.ts
export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Validate input
  const body = await request.json();
  const schema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    // ...
  });
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 3. RLS handles authorization automatically
  const { error } = await supabase.from("notifications").insert({ /* ... */ });
  
  return NextResponse.json({ error: error?.message || null });
}
```

### Rate Limiting

**Implemented via Vercel Edge Functions:**
- 100 requests/minute per IP (general)
- 10 requests/minute per user for write operations
- 5 login attempts per 5 minutes

### CORS Configuration

```typescript
// next.config.ts
const config = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};
```

### Environment Variable Protection

```bash
# .env.local - NEVER commit to Git
NEXT_PUBLIC_SUPABASE_URL=       # Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public (limited permissions)
NEXT_PUBLIC_APP_URL=            # Public

SUPABASE_SERVICE_ROLE_KEY=      # SECRET - Server-only
RESEND_API_KEY=                 # SECRET - Server-only
OPENAI_API_KEY=                 # SECRET - Server-only
```

**Security Measure**: Supabase `anon` key has limited permissions. Full admin access requires `service_role` key (server-only).

**Fixed Vulnerabilities:**
- ✅ **BUG-005**: Email service now server-side only (no client-side Resend initialization)
- ✅ **BUG-011**: OTP not exposed in API response in production (`NODE_ENV !== "production"`)

---

## ⚠️ Known Security Issues

### Critical Issues (Fixed)

#### BUG-033: Case Number Race Condition (FIXED ✅)
- **Severity**: Critical
- **Impact**: Duplicate case numbers causing unique constraint violations
- **Fix**: Replaced RPC-based generation with atomic BEFORE INSERT trigger + advisory lock
- **Migration**: `00034_fix_case_number_race_condition.sql`

#### BUG-001: No Role-Based Route Protection (FIXED ✅)
- **Severity**: Critical
- **Impact**: Any authenticated user could access any route
- **Fix**: Added middleware role-based route map with deny-list approach

### High-Severity Issues (Fixed)

#### BUG-020: Lawyer Assignment Verification Missing (FIXED ✅)
- **Impact**: Any lawyer could accept any case
- **Fix**: Added `.eq("lawyer_id", user.id)` to assignment queries

#### BUG-021: Decline Case Authorization Missing (FIXED ✅)
- **Impact**: Any lawyer could decline any case
- **Fix**: Added lawyer ID verification to decline query

#### BUG-008: Scrutiny Status Guard Missing (FIXED ✅)
- **Impact**: Cases could be approved from wrong statuses
- **Fix**: Added `.in("status", ["submitted_to_admin", "under_scrutiny"])` guard

### Medium-Severity Issues

#### BUG-010: Decline Case RLS Timing (Known Issue)
- **Severity**: Medium
- **Impact**: No transaction; partial failure leaves inconsistent state
- **Status**: ⚠️ Documented, low real-world risk for FYP
- **Mitigation**: RLS policies prevent unauthorized access even in inconsistent state

#### BUG-025: Lawyer Profile API IDOR Risk (Accepted)
- **Severity**: Medium
- **Impact**: Lawyer profile API accepts arbitrary user_id without session
- **Status**: ⚠️ Accepted Risk - Needed for post-signup flow, duplicate check prevents abuse
- **Mitigation**: Data is non-sensitive (bar license, specialization)

### Low-Severity Issues

#### BUG-026: Hearing Notification Self-Send
- **Impact**: Court official receives their own "Hearing Scheduled" notification
- **Fix**: Add `if (pid === user.id) continue;` check

#### BUG-030: Hearing Number Race Condition
- **Impact**: Concurrent hearing scheduling could create duplicate numbers
- **Mitigation**: Low probability; add unique constraint on `(case_id, hearing_number)`

---

## 🚨 Vulnerability Reporting

### Reporting Process

If you discover a security vulnerability, please follow responsible disclosure:

1. **DO NOT** open a public GitHub issue
2. Email: **security@civilex.pk** (or project maintainer)
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Development**: 14-30 days (depending on severity)
- **Disclosure**: After patch is deployed + 14-day grace period

### Severity Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Auth bypass, SQL injection, RCE | 24-48 hours |
| High | XSS, CSRF, data exposure | 7 days |
| Medium | Information disclosure, DoS | 14 days |
| Low | UI bugs, minor info leaks | 30 days |

### Bug Bounty

Currently **no bug bounty program**. Security researchers acknowledged in:
- SECURITY.md (this file)
- Project credits
- GitHub release notes

---

## ✅ Security Best Practices

### For Developers

1. **Never commit secrets** to Git
   - Use `.env.local` (gitignored)
   - Rotate keys if accidentally exposed

2. **Always validate inputs**
   - Use Zod schemas on all API routes
   - Sanitize user-provided content

3. **Test RLS policies**
   - Create test users for each role
   - Verify unauthorized queries fail

4. **Audit SECURITY DEFINER functions**
   - Minimize their use
   - Review carefully before deployment

5. **Use parameterized queries**
   - Never concatenate SQL strings
   - Supabase client handles this automatically

6. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

### For Administrators

1. **Enable MFA** for production Supabase project
2. **Restrict database access** to specific IP ranges
3. **Monitor audit logs** for suspicious activity
4. **Regular backups** (Supabase automated daily)
5. **Review RLS policies** quarterly
6. **Rotate API keys** annually or on breach

### For Users

1. **Use strong passwords** (8+ chars, mixed case, numbers)
2. **Don't share accounts** - each user gets their own role
3. **Log out on shared devices**
4. **Report suspicious activity** to admin
5. **Verify email authenticity** (phishing prevention)

---

## 📜 Compliance

### Data Protection Standards

#### GDPR Considerations (if EU users)
- ✅ Right to access: Users can download their case data
- ✅ Right to erasure: Admin can anonymize cases (legal retention applies)
- ✅ Data portability: Export functionality available
- ⚠️ Consent management: Not fully implemented (FYP scope)

#### Pakistan Data Protection Act (Expected)
- ✅ Lawful processing: Court cases are legal proceedings
- ✅ Data minimization: Only necessary data collected
- ✅ Security measures: Encryption, RLS, audit logs
- ✅ Breach notification: Email alerts configured

### Legal Compliance

#### Court Records Retention
- **Civil Cases**: 20 years (Pakistan law)
- **Criminal Cases**: Permanent retention
- **Family Cases**: 15 years

#### Electronic Signatures
- **OTP Signatures**: Valid under Pakistan Electronic Transactions Ordinance 2002
- **Timestamp**: ISO 8601 format with audit trail
- **Non-repudiation**: Email + OTP provides dual-factor authentication

---

## 📊 Audit & Logging

### Activity Logging

**All case actions** are logged in `case_activity_log` table:

```typescript
{
  case_id: string;
  actor_id: string;        // Who performed the action
  action: string;          // What they did
  details: object;         // Additional context (fee amount, status, etc.)
  created_at: timestamp;   // When it happened
}
```

**Logged Actions:**
- `case_created`
- `lawyer_accepted`, `lawyer_declined`
- `payment_confirmed`
- `status_changed` (with old/new status)
- `document_uploaded`
- `scrutiny_approved`, `scrutiny_returned`
- `hearing_scheduled`
- `judgment_delivered`
- `summon_issued`

### Audit Trail Features

1. **Immutable Logs**: No DELETE policy on activity logs
2. **Actor Tracking**: Every action tied to a user ID
3. **Timestamp Precision**: Microsecond-level timestamps
4. **Details Retention**: JSON blob stores contextual data
5. **Query Performance**: Indexed on `case_id` and `created_at`

### Monitoring

**Recommended Tools:**
- **Supabase Logs**: Built-in query and error logs
- **Vercel Analytics**: Request monitoring, error tracking
- **Sentry**: Error reporting (to be integrated)
- **LogRocket**: Session replay (to be integrated)

### Database Backups

**Supabase Automated Backups:**
- Daily snapshots (retained 7 days)
- Point-in-time recovery (last 7 days)
- Manual backups via `pg_dump`

```bash
# Manual backup
pg_dump -h your-db.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

---

## 🔄 Security Update Policy

### Regular Security Reviews

- **Quarterly**: RLS policy audit
- **Bi-annually**: Dependency updates (`npm audit`)
- **Annually**: Penetration testing (if budget allows)
- **On CVE**: Immediate patch if critical vulnerability

### Security Changelog

All security fixes documented in:
- [CLAUDE.md](CLAUDE.md) - Complete bug tracker
- [GitHub Releases](https://github.com/yourusername/civilex/releases) - Version notes
- SECURITY.md (this file) - Known issues section

---

## 📞 Contact

- **Security Email**: security@civilex.pk
- **General Issues**: [GitHub Issues](https://github.com/yourusername/civilex/issues)
- **Private Disclosure**: Direct message to project maintainer

---

## 📄 License

This security policy is part of the Civilex project, licensed under the MIT License.

---

<div align="center">

**Last Updated**: April 25, 2026

**Security is everyone's responsibility. Report issues responsibly.**

</div>
