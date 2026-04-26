# Civilex — Judiciary Management System

<div align="center">

![Civilex Logo](public/logo.png)

**A comprehensive digital solution for managing civil, criminal, and family court cases in Pakistan**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [User Roles & Workflows](#user-roles--workflows)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**Civilex** is a modern, full-stack judiciary management system designed to digitize and streamline court operations in Pakistan. The platform handles the complete lifecycle of civil, criminal, and family court cases—from filing to judgment execution—with support for multiple user roles, real-time notifications, AI-powered document drafting, and comprehensive case tracking.

### Key Objectives

- **Digitize Court Processes**: Eliminate paper-based workflows
- **Increase Transparency**: Real-time case tracking for all parties
- **Improve Efficiency**: Automated notifications, status tracking, and document management
- **Ensure Compliance**: Built-in validation, audit trails, and Row Level Security (RLS)
- **Enhance Accessibility**: Web-based platform accessible from anywhere

---

## ✨ Features

### 🏛️ Case Management

- **Multi-Type Support**: Civil, Criminal, and Family cases
- **20+ Case Statuses**: From draft to final execution
- **Case Timeline**: Visual journey tracking with activity logs
- **Status Progress**: Real-time progress bars showing visited statuses
- **Case Assignment**: Automatic lawyer-client linking
- **Case Withdrawal**: Plaintiff can withdraw before judgment

### 👥 User Roles (6 Roles)

1. **Client**: File cases, hire lawyers, make payments, track progress
2. **Lawyer**: Accept cases, draft documents, represent clients, file appeals
3. **Admin Court**: Scrutiny, case registration, summon issuance
4. **Magistrate**: Bail decisions, preliminary hearings, case management
5. **Trial Judge**: Preside over trials, deliver judgments, sign decrees
6. **Stenographer**: Record hearing proceedings and transcripts

### 📄 Document Management

- **Document Upload**: Support for pleas, evidence, written statements, etc.
- **AI Document Drafting**: GPT-4o-mini powered legal document generation
- **Document Access Control**: Role-based permissions with RLS
- **Document Requests**: Lawyers can request documents from parties
- **Digital Signatures**: OTP-based signature verification

### ⚖️ Court Proceedings

- **Scrutiny Workflow**: Multi-checklist validation with targeted returns
- **Summon System**: Automated defendant notification with claim tokens
- **Hearings Management**: Schedule, adjourn, mark completed with transcripts
- **Issue Framing**: Frame legal/factual issues for trial
- **Evidence Stage**: Submit and track evidence
- **Witness Management**: Summon and cross-examine witnesses
- **Judgment Delivery**: Structured verdict recording with digital signatures
- **Decree Execution**: Track decree fulfillment and satisfaction

### 🔔 Notifications & Email

- **In-App Notifications**: Real-time updates via Supabase Realtime
- **Email Notifications**: 22+ email templates via Gmail SMTP
- **Email Templates**: Case accepted, payment reminder, hearing scheduled, judgment delivered, etc.
- **Smart Routing**: Server-side email delivery via nodemailer

### 💰 Payment System

- **Lawyer Fee Management**: Set fees with optional installments
- **Payment Tracking**: Monitor pending, processing, and completed payments
- **Payment Verification**: Update case status on full payment
- **Email Alerts**: Payment confirmations and reminders

### 🚨 Criminal Case Features

- **Bail Applications**: File, track, and decide bail requests
- **Investigation Tracking**: IO assignment, challan submission
- **FIR Management**: Link and track First Information Reports

### 📊 Appeals & Execution

- **Appeal Filing**: High Court and Supreme Court appeals with limitation tracking
- **Appeal Status**: Filed → Admitted → Disposed
- **Decree Execution**: Track execution applications and satisfaction
- **Execution Status**: Pending → In Progress → Satisfied

### 🤖 AI Integration

- **OpenAI GPT-4o-mini**: Legal document generation
- **Template Types**: Evidence, affidavits, applications, written statements, etc.
- **Context-Aware**: Uses case details for accurate drafting

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 16.1.6](https://nextjs.org/) (App Router, React Server Components)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod 4](https://zod.dev/)

### Backend

- **Database**: [Supabase](https://supabase.com/) (PostgreSQL 15)
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (Document uploads)
- **Realtime**: Supabase Realtime (Notifications)
- **Email Service**: Gmail SMTP via [nodemailer](https://nodemailer.com/)
- **AI Service**: [OpenAI](https://openai.com/) (GPT-4o-mini)

### Database Features

- **18 Tables**: Cases, profiles, payments, hearings, judgments, etc.
- **Row Level Security (RLS)**: All tables secured with granular policies
- **Triggers**: Automated case number generation, activity logging
- **Enums**: Type-safe status, role, and category definitions
- **Advisory Locks**: Race condition prevention (case number generation)

---

## 🏗️ Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   (auth)     │  │  (dashboard) │  │     API      │     │
│  │  Login/Reg   │  │ Cases/Hearings│ │   Routes     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
    ┌────────────────────┐   ┌──────────────────┐
    │  React Components  │   │   Custom Hooks   │
    │   - Features       │   │   - useCases     │
    │   - UI             │   │   - usePayments  │
    │   - Layout         │   │   - useHearings  │
    └────────────────────┘   └──────────────────┘
                            │
                ┌───────────┴───────────────────────┐
                ▼                                   ▼
    ┌─────────────────────┐           ┌──────────────────────┐
    │   Supabase Client   │           │   External Services  │
    │  - Auth             │           │   - Gmail SMTP       │
    │  - Database         │           │   - OpenAI (AI)      │
    │  - Storage          │           └──────────────────────┘
    │  - Realtime         │
    └─────────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │   PostgreSQL + RLS           │
    │   - 18 Tables                │
    │   - Row Level Security       │
    │   - Triggers & Functions     │
    └──────────────────────────────┘
```

### Database Schema Overview

```
users (Supabase Auth) ─┬─> profiles
                       │
cases ─────┬───────────┼─> case_assignments
           │           │
           ├───────────┼─> payments
           │           │
           ├───────────┼─> documents
           │           │
           ├───────────┼─> hearings ──> hearing_attendance
           │           │               └> hearing_transcripts
           │           │
           ├───────────┼─> case_issues
           │           │
           ├───────────┼─> scrutiny_checklist
           │           │
           ├───────────┼─> judgment_records ──> decree_records
           │           │                     └> execution_applications
           │           │
           ├───────────┼─> appeal_records
           │           │
           ├───────────┼─> case_activity_log
           │           │
           └───────────┼─> notifications
```

---

## 📦 Installation

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Git**: For cloning the repository
- **Supabase Account**: [Sign up](https://supabase.com/)
- **Gmail Account**: With App Password enabled (for email)
- **OpenAI API Key**: [Get key](https://platform.openai.com/) (for AI features)

### Clone Repository

```bash
git clone https://github.com/chmuhammadasim/civilex.git
cd civilex
```

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

---

## 🔐 Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
EMAIL_FROM="Civilex <your-email@gmail.com>"
ENABLE_EMAILS=true  # Set to false to disable in development

# AI Service (OpenAI)
OPENAI_API_KEY=sk-your-api-key
```

### Getting Supabase Credentials

1. Create a project at [supabase.com](https://supabase.com/)
2. Go to **Project Settings** → **API**
3. Copy **Project URL** and **anon/public key**

### Getting Gmail App Password

1. Enable 2-Factor Authentication on your Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select **Mail** → **Other (Custom name)** → Enter "Civilex"
4. Click **Generate** and copy the 16-character password
5. Paste it as `GMAIL_APP_PASSWORD` in `.env.local`

See [EMAIL_INTEGRATION_GUIDE.md](EMAIL_INTEGRATION_GUIDE.md) for detailed setup instructions.

### Getting OpenAI API Key

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Go to **API Keys** → Create new key
3. Set up billing (AI document drafting uses GPT-4o-mini)

---

## 🗄️ Database Setup

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations to database
npx supabase db push
```

### Option 2: Manual SQL Execution

1. Go to Supabase Dashboard → **SQL Editor**
2. Run migrations in order from `supabase/migrations/`:
   - `00001_create_profiles.sql`
   - `00002_create_cases.sql`
   - `00003_create_payments.sql`
   - ... (all files in numeric order)
   - `00034_fix_case_number_race_condition.sql`

### Seed Data (Optional)

```bash
# Run seed data for demo users
psql -h your-db-host -U postgres -d postgres -f supabase/seed.sql
```

**Demo Users:**
- Client: `client1@civilex.pk` / `demo123456`
- Lawyer: `lawyer1@civilex.pk` / `demo123456`
- Admin: `admin@civilex.pk` / `demo123456`
- Judge: `judge1@civilex.pk` / `demo123456`

---

## 🚀 Running the Project

### Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

### Run Tests

```bash
# Unit tests (to be added)
npm run test

# E2E tests with Playwright (to be configured)
npm run test:e2e
```

### Linting & Type Checking

```bash
# ESLint
npm run lint

# TypeScript type check
npm run type-check
```

---

## 👤 User Roles & Workflows

### 1️⃣ Client Workflow

```
Register → Hire Lawyer → Create Case → Pay Lawyer Fee → Track Progress
    ↓
Receive Notifications (Case updates, hearings, judgment)
    ↓
Optional: Withdraw case, File appeal after judgment
```

### 2️⃣ Lawyer Workflow

```
Register → Verify Bar License → Accept Case Assignment → Set Fee
    ↓
Draft Case Documents → Submit to Admin Court
    ↓
Receive Scrutiny Feedback → Revise if needed
    ↓
Represent Client in Hearings → Submit Evidence → File Final Arguments
    ↓
Receive Judgment → Optional: File Appeal
```

### 3️⃣ Admin Court Workflow

```
Review Submitted Cases → Scrutiny Checklist (7 items)
    ↓
Approve OR Return for Revision (specify side: plaintiff/defendant/both)
    ↓
Register Case → Issue Summon to Defendant
    ↓
Schedule Preliminary Hearing → Assign Trial Judge → Transfer to Trial
```

### 4️⃣ Judge Workflow

```
Receive Case Assignment → Conduct Preliminary Hearing
    ↓
Frame Issues (legal/factual) → Transfer to Trial Court
    ↓
Start Evidence Stage → Manage Hearings → Record Witness Testimony
    ↓
Move to Arguments → Review Final Arguments → Reserve for Judgment
    ↓
Deliver Judgment (verdict, relief, costs) → Sign Digitally (OTP)
    ↓
Draw Decree → Track Execution → Mark Satisfied
```

### 5️⃣ Magistrate Workflow

```
Handle Criminal Cases → Review Bail Applications → Approve/Deny
    ↓
Track Investigation → IO Assignment → Challan Submission
    ↓
Conduct Preliminary Hearings → Frame Issues → Transfer to Trial
```

### 6️⃣ Stenographer Workflow

```
Attend Hearings → Record Proceedings → Create Transcripts
    ↓
Mark Attendance → Update Workload Tracking
```

---

## 📁 Project Structure

```
civilex/
├── public/                      # Static assets
│   └── logo.png
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/         # Protected dashboard pages
│   │   │   ├── cases/           # Case management
│   │   │   │   ├── [caseId]/    # Case detail page
│   │   │   │   ├── new/         # Create new case
│   │   │   │   └── scrutiny/    # Scrutiny queue
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── lawyers/         # Lawyer directory
│   │   │   └── settings/        # User settings
│   │   ├── api/                 # API routes
│   │   │   ├── cases/           # Case-related APIs
│   │   │   ├── notifications/   # Notification APIs
│   │   │   ├── payments/        # Payment APIs
│   │   │   └── summon/          # Summon APIs
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── components/              # React components
│   │   ├── features/            # Feature-specific components
│   │   │   ├── cases/           # Case components
│   │   │   ├── criminal/        # Criminal case components
│   │   │   ├── documents/       # Document components
│   │   │   ├── scrutiny/        # Scrutiny components
│   │   │   ├── signatures/      # Digital signature components
│   │   │   └── trial/           # Trial court components
│   │   ├── layout/              # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── providers/           # React context providers
│   │   │   ├── AuthProvider.tsx
│   │   │   └── NotificationProvider.tsx
│   │   └── ui/                  # Reusable UI components
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Spinner.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useCases.ts          # Case management
│   │   ├── usePayments.ts       # Payment operations
│   │   ├── useHearings.ts       # Hearing management
│   │   ├── useJudgment.ts       # Judgment delivery
│   │   ├── useAuth.ts           # Authentication
│   │   └── useNotifications.ts  # Notifications
│   ├── lib/                     # Utility libraries
│   │   ├── constants.ts         # App constants & enums
│   │   ├── utils.ts             # Helper functions
│   │   ├── helpers/             # Helper modules
│   │   │   └── notificationAPI.ts
│   │   ├── services/            # External services
│   │   │   └── email.ts         # Email service (Resend)
│   │   ├── supabase/            # Supabase clients
│   │   │   ├── client.ts        # Browser client
│   │   │   └── server.ts        # Server client
│   │   └── validations/         # Zod schemas
│   │       ├── auth.ts
│   │       └── case.ts
│   └── types/                   # TypeScript type definitions
│       ├── auth.ts
│       ├── case.ts
│       ├── criminal.ts
│       ├── hearing.ts
│       ├── notification.ts
│       ├── payment.ts
│       ├── signature.ts
│       └── trial.ts
├── supabase/                    # Database files
│   ├── migrations/              # SQL migrations (34 files)
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_cases.sql
│   │   ├── 00034_fix_case_number_race_condition.sql
│   │   └── ...
│   ├── schema.sql               # Complete schema
│   ├── seed.sql                 # Seed data
│   └── config.toml              # Supabase config
├── tests/                       # Test files
│   └── e2e/                     # Playwright E2E tests
├── .env.local                   # Environment variables (gitignored)
├── middleware.ts                # Next.js middleware (auth)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
├── CLAUDE.md                    # Development documentation
└── README.md                    # This file
```

---

## 🔌 API Documentation

### REST API Routes

#### Cases API

```typescript
// Create new case
POST /api/cases
Body: { title, description, case_type, category, ... }

// Link defendant to case
POST /api/cases/link-defendant
Auth: Client role only
```

#### Notifications API

```typescript
// Send notification with email
POST /api/notifications/send
Body: {
  userId, userEmail, title, message, type,
  emailTemplate, emailData
}
```

#### Summon API

```typescript
// Issue court summon
POST /api/summon/send
Body: { case_id }
Auth: Admin Court role only
```

#### Payments API

```typescript
// Get case payments
GET /api/payments/[caseId]

// Process payment
POST /api/payments/process
Body: { payment_id, case_id }
```

### Supabase Client Usage

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Query with RLS
const { data } = await supabase
  .from("cases")
  .select("*, plaintiff:profiles!plaintiff_id(*)")
  .eq("status", "registered");

// Insert with RLS
const { error } = await supabase
  .from("case_activity_log")
  .insert({ case_id, actor_id, action: "case_created" });
```

---

## 🧪 Testing

### Test Stack (To Be Implemented)

- **Unit Tests**: Vitest
- **Integration Tests**: Vitest + Supabase Test DB
- **E2E Tests**: Playwright
- **Coverage**: c8/nyc

### Test Commands

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run coverage

# Test specific feature
npm run test -- useCases

# Debug tests
npm run test:debug
```

### Known Bugs

See [CLAUDE.md](CLAUDE.md) for the complete bug tracker with 33 documented issues and fixes.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chmuhammadasim/civilex)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

**Environment Variables**: Add all `.env.local` variables to Vercel project settings.

### Deploy to Other Platforms

#### Netlify

```bash
npm run build
# Deploy 'out' directory
```

#### Self-Hosted (Docker)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Pre-Deployment Checklist

- ✅ Set all environment variables
- ✅ Run database migrations on production DB
- ✅ Configure domain for Resend email
- ✅ Set up Supabase RLS policies
- ✅ Enable Supabase Realtime on required tables
- ✅ Test authentication flow
- ✅ Verify email delivery
- ✅ Check CORS settings
- ✅ Enable database backups

---

## 📚 Additional Documentation

- **[CLAUDE.md](CLAUDE.md)**: Complete development log, bug tracker, testing standards
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)**: Original implementation roadmap
- **[QA_REPORT.md](QA_REPORT.md)**: Quality assurance findings
- **[EMAIL_INTEGRATION_GUIDE.md](EMAIL_INTEGRATION_GUIDE.md)**: Email setup guide
- **[AI_DRAFTING_README.md](AI_DRAFTING_README.md)**: AI document drafting guide

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Follow existing TypeScript/React patterns
- Use Prettier for formatting
- Run ESLint before committing
- Write meaningful commit messages
- Add comments for complex logic

### Development Workflow

1. Check [CLAUDE.md](CLAUDE.md) for known issues
2. Create a todo list for multi-step work
3. Write tests for new features
4. Update documentation
5. Test across different roles
6. Verify RLS policies

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Supabase** - Backend infrastructure
- **Vercel** - Deployment platform
- **OpenAI** - AI-powered document drafting
- **Resend** - Email delivery service
- **Tailwind CSS** - Utility-first CSS framework

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/chmuhammadasim/civilex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chmuhammadasim/civilex/discussions)
- **Email**: support@civilex.pk

---

<div align="center">

**Made with ❤️ for the Pakistani Judiciary System**

⭐ Star this repo if you find it useful!

</div>
