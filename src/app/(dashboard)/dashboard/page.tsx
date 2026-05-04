"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton, { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import LawyerCaseReview from "@/components/features/cases/LawyerCaseReview";
import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/useCases";
import { usePayments } from "@/hooks/usePayments";
import { useNotifications } from "@/hooks/useNotifications";
import { useStenographerWorkload } from "@/hooks/useStenographerWorkload";
import { ROLE_LABELS, CASE_STATUS_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Briefcase,
  CreditCard,
  Calendar,
  Bell,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Scale,
  ClipboardCheck,
  Gavel,
  FileText,
  Users,
  Bot,
  Shield,
  Lock,
  PenLine,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { cases, isLoading: casesLoading, fetchCases, acceptCase, declineCase } = useCases();
  const { payments, isLoading: paymentsLoading, syncCasePaymentStatus } = usePayments();
  const { notifications, unreadCount } = useNotifications();
  const { rows: stenoRows } = useStenographerWorkload();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isLoading = casesLoading || paymentsLoading;
  const role = user?.role;

  // Manual sync function for stuck cases
  const handleManualSync = async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    try {
      console.log(`[Sync] Starting manual sync...`);
      console.log(`[Sync] User ID: ${user.id}, Role: ${role}`);
      console.log(`[Sync] Total cases: ${cases.length}`);
      console.log(`[Sync] Total payments: ${payments.length}`);
      
      // Find cases stuck in payment_pending but with at least one completed payment
      const stuckCases = cases.filter((c) => {
        if (c.status !== "payment_pending") return false;
        
        const completedPayments = payments.filter(
          (p) => p.case_id === c.id && p.status === "completed"
        );
        
        const pendingPayments = payments.filter(
          (p) => p.case_id === c.id && p.status === "pending"
        );
        
        console.log(`[Sync] Case ${c.case_number} (${c.id}):`);
        console.log(`  - Status: ${c.status}`);
        console.log(`  - Completed payments: ${completedPayments.length}`);
        console.log(`  - Pending payments: ${pendingPayments.length}`);
        console.log(`  - Plaintiff: ${c.plaintiff_id}, Defendant: ${c.defendant_id}`);
        
        return completedPayments.length > 0;
      });

      console.log(`[Sync] Found ${stuckCases.length} stuck cases:`, stuckCases.map(c => ({ id: c.id, number: c.case_number })));

      // Sync each stuck case
      let syncedCount = 0;
      for (const c of stuckCases) {
        console.log(`[Sync] Syncing case ${c.case_number} (${c.id})...`);
        const result = await syncCasePaymentStatus(c.id);
        console.log(`[Sync] Result for ${c.case_number}:`, result);
        if (result.updated) {
          syncedCount++;
        } else if (result.error) {
          console.error(`[Sync] Error for ${c.case_number}: ${result.error}`);
        }
      }

      // Refresh cases if any were synced
      if (syncedCount > 0) {
        console.log(`[Sync] Successfully synced ${syncedCount} cases, refreshing...`);
        await fetchCases();
        console.log(`[Sync] Refresh complete`);
      } else {
        console.log(`[Sync] No cases were synced`);
      }
    } catch (err) {
      console.error("[Sync] Unexpected error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-link defendant cases by email on mount (runs once when user is a client).
  // The link-defendant API uses the admin client so it can find cases where
  // defendant_email matches but defendant_id is still NULL (pre-link state).
  // After linking, re-fetch cases so the dashboard shows the linked cases.
  useEffect(() => {
    if (!user || role !== "client") return;

    fetch("/api/cases/link-defendant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.linked > 0) {
          fetchCases();
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);

  // Auto-sync payment status for stuck cases on mount
  useEffect(() => {
    if (!user || role !== "client" || casesLoading || paymentsLoading) return;

    const timer = setTimeout(() => {
      handleManualSync();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, role, casesLoading, paymentsLoading]);

  // Compute stats
  // For lawyers: "active" means they have an accepted assignment (excludes pending requests)
  // For others: exclude terminal/pre-filing statuses
  const activeCases =
    role === "lawyer"
      ? cases.filter((c) =>
          c.assignments?.some(
            (a) => a.lawyer_id === user?.id && a.status === "accepted"
          )
        ).length
      : cases.filter(
          (c) =>
            !["closed", "disposed", "draft", "pending_lawyer_acceptance"].includes(
              c.status
            )
        ).length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const upcomingHearings = cases.filter((c) => c.next_hearing_date).length;
  const closedCases = cases.filter((c) =>
    ["closed", "disposed", "judgment_delivered"].includes(c.status)
  ).length;

  // Lawyer-specific: pending case requests
  const pendingRequests =
    role === "lawyer"
      ? cases.filter((c) =>
          c.assignments?.some(
            (a) => a.lawyer_id === user?.id && a.status === "pending"
          )
        )
      : [];

  // Client-specific: cases awaiting payment
  // Only show cases that have ACTUAL pending payments, not just the status
  const awaitingPayment =
    role === "client"
      ? cases.filter((c) => {
          // Must be in payment_pending status
          if (c.status !== "payment_pending") return false;
          
          // Check if there are actual pending/processing payments for this case
          const hasPendingPayments = payments.some(
            (p) =>
              p.case_id === c.id &&
              (p.status === "pending" || p.status === "processing")
          );
          
          return hasPendingPayments;
        })
      : [];

  // Admin Court: cases pending scrutiny
  const pendingScrutiny =
    role === "admin_court"
      ? cases.filter((c) =>
          ["submitted_to_admin", "under_scrutiny"].includes(c.status)
        )
      : [];

  // Trial judge: active trial cases
  const trialCases =
    role === "trial_judge"
      ? cases.filter((c) =>
          [
            "transferred_to_trial",
            "evidence_stage",
            "arguments",
            "reserved_for_judgment",
          ].includes(c.status)
        )
      : [];

  // Role-specific stats
  const getStats = () => {
    const base = [
      {
        label: "Active Cases",
        value: activeCases.toString(),
        icon: Briefcase,
        color: "text-primary",
        bg: "bg-primary/10",
        href: "/cases",
      },
    ];

    if (role === "client" || role === "lawyer") {
      base.push({
        label: "Pending Payments",
        value: pendingPayments.toString(),
        icon: CreditCard,
        color: "text-amber-600",
        bg: "bg-amber-50",
        href: "/payments",
      });
    }

    base.push({
      label: "Upcoming Hearings",
      value: upcomingHearings.toString(),
      icon: Calendar,
      color: "text-info",
      bg: "bg-blue-50",
      href: "/cases",
    });

    if (role === "lawyer") {
      base.push({
        label: "Case Requests",
        value: pendingRequests.length.toString(),
        icon: AlertCircle,
        color: "text-danger",
        bg: "bg-red-50",
        href: "/cases",
      });
      const draftCount = cases.filter(
        (c) =>
          ["drafting", "returned_for_revision"].includes(c.status) &&
          c.assignments?.some((a) => a.lawyer_id === user?.id && a.status === "accepted")
      ).length;
      if (draftCount > 0) {
        base.push({
          label: "Drafts Pending",
          value: draftCount.toString(),
          icon: PenLine,
          color: "text-primary",
          bg: "bg-primary/10",
          href: "/cases",
        });
      }
    } else if (role === "admin_court") {
      base.push({
        label: "Pending Scrutiny",
        value: pendingScrutiny.length.toString(),
        icon: ClipboardCheck,
        color: "text-amber-600",
        bg: "bg-amber-50",
        href: "/cases/scrutiny",
      });
      const awaitingSummons = cases.filter((c) => c.status === "registered").length;
      if (awaitingSummons > 0) {
        base.push({
          label: "Awaiting Summons",
          value: awaitingSummons.toString(),
          icon: FileText,
          color: "text-primary",
          bg: "bg-primary/10",
          href: "/cases",
        });
      }
    } else if (role === "trial_judge") {
      base.push({
        label: "Trial Cases",
        value: trialCases.length.toString(),
        icon: Gavel,
        color: "text-primary",
        bg: "bg-primary/10",
        href: "/cases",
      });
      const reservedCount = trialCases.filter((c) => c.status === "reserved_for_judgment").length;
      if (reservedCount > 0) {
        base.push({
          label: "Reserved for Judgment",
          value: reservedCount.toString(),
          icon: Gavel,
          color: "text-amber-600",
          bg: "bg-amber-50",
          href: "/cases",
        });
      }
    } else if (role === "stenographer") {
      const todayCount = stenoRows.filter((r) => {
        const d = new Date(r.hearing.scheduled_date);
        const t = new Date();
        return (
          d.getFullYear() === t.getFullYear() &&
          d.getMonth() === t.getMonth() &&
          d.getDate() === t.getDate()
        );
      }).length;
      const pendingTranscripts = stenoRows.filter(
        (r) => r.hearing.status === "completed" && (!r.transcript || r.transcript.status === "draft")
      ).length;
      base.push({
        label: "Hearings Today",
        value: todayCount.toString(),
        icon: Calendar,
        color: "text-info",
        bg: "bg-blue-50",
        href: "/stenographer/today",
      });
      base.push({
        label: "Pending Transcripts",
        value: pendingTranscripts.toString(),
        icon: PenLine,
        color: "text-amber-600",
        bg: "bg-amber-50",
        href: "/stenographer/transcripts",
      });
    } else {
      base.push({
        label: "Notifications",
        value: unreadCount.toString(),
        icon: Bell,
        color: "text-danger",
        bg: "bg-red-50",
        href: "/notifications",
      });
    }

    return base;
  };

  const stats = getStats();

  // Role-specific greetings
  const getRoleGreeting = () => {
    switch (role) {
      case "client":
        return "Track your cases and manage legal proceedings.";
      case "lawyer":
        return "Review case requests and manage your active matters.";
      case "admin_court":
        return "Review submitted cases and manage court administration.";

      case "trial_judge":
        return "Manage trial proceedings, evidence, and judgments.";
      case "stenographer":
        return "Record proceedings and manage court documentation.";
      default:
        return "Here's an overview of your legal activities.";
    }
  };

  return (
    <div>
      <Topbar title="Dashboard" />

      <div className="p-6">
        {/* Welcome message */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Welcome back, {user?.full_name || "User"}!
            </h2>
            <p className="mt-1 text-sm text-muted">{getRoleGreeting()}</p>
            <Badge variant="primary" className="mt-2">
              {user?.role ? ROLE_LABELS[user.role] : "User"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* ── Tomorrow's Hearings (pinned at top, all roles) ── */}
        {!isLoading && (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().slice(0, 10);

          // For stenographer, use stenoRows; for other roles use cases
          const tomorrowHearings = role === "stenographer"
            ? stenoRows.filter((r) => r.hearing.scheduled_date?.slice(0, 10) === tomorrowStr)
            : cases.filter(
                (c) => c.next_hearing_date && c.next_hearing_date.slice(0, 10) === tomorrowStr
              );

          if (tomorrowHearings.length === 0) return null;

          return (
            <div className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-md">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-800">
                    🔔 Tomorrow&apos;s Hearings
                  </h3>
                  <p className="text-xs text-amber-700">
                    {tomorrowHearings.length} hearing{tomorrowHearings.length > 1 ? "s" : ""} scheduled for tomorrow — be prepared!
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {role === "stenographer"
                  ? (tomorrowHearings as typeof stenoRows).map(({ hearing }) => (
                      <Link
                        key={hearing.id}
                        href={`/cases/${hearing.case_id}/hearings/${hearing.id}`}
                        className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 hover:bg-amber-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{hearing.case?.title}</p>
                          <p className="text-xs text-amber-700">
                            {hearing.case?.case_number} · Hearing #{hearing.hearing_number}
                            {hearing.courtroom && ` · ${hearing.courtroom}`}
                          </p>
                        </div>
                        <Badge variant="warning">Tomorrow</Badge>
                      </Link>
                    ))
                  : (tomorrowHearings as typeof cases).map((c) => (
                      <Link
                        key={c.id}
                        href={`/cases/${c.id}`}
                        className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 hover:bg-amber-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-amber-700">
                            {c.case_number} · {formatDate(c.next_hearing_date!)}
                          </p>
                        </div>
                        <Badge variant="warning">Tomorrow</Badge>
                      </Link>
                    ))}
              </div>
            </div>
          );
        })()}

        {/* Stats grid with skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card padding="md" className="transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Role-specific sections */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Lawyer: Pending Case Requests */}
            {role === "lawyer" && pendingRequests.length > 0 && (
              <LawyerCaseReview
                pendingCases={pendingRequests}
                lawyerId={user!.id}
                onActionComplete={fetchCases}
                acceptCase={acceptCase}
                declineCase={declineCase}
              />
            )}

            {/* Defendant: Summoned cases needing lawyer */}
            {role === "client" && cases.some((c) => c.defendant_id === user?.id && !c.assignments?.some((a) => a.side === "defendant" && a.status !== "declined")) && (
              <Card>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
                  <Scale className="h-5 w-5" />
                  Court Summon — Action Required
                </h3>
                <div className="space-y-3">
                  {cases
                    .filter((c) => c.defendant_id === user?.id && !c.assignments?.some((a) => a.side === "defendant" && a.status !== "declined"))
                    .map((c) => (
                      <div key={c.id} className="rounded-lg border border-warning bg-amber-50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-muted">{c.case_number} • You have been summoned as defendant</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Link href={`/cases/${c.id}`}>
                            <Button size="sm" variant="outline">View Case</Button>
                          </Link>
                          <Link href="/lawyers">
                            <Button size="sm" variant="primary">
                              <Users className="h-4 w-4" />
                              Hire Lawyer
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Defendant: Written statement phase notification */}
            {role === "client" &&
              cases.some(
                (c) =>
                  c.defendant_id === user?.id &&
                  ["summon_issued", "preliminary_hearing", "notice_issued"].includes(c.status)
              ) && (
                <Card>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
                    <Scale className="h-5 w-5" />
                    Written Statement Required
                  </h3>
                  <div className="space-y-3">
                    {cases
                      .filter(
                        (c) =>
                          c.defendant_id === user?.id &&
                          ["summon_issued", "preliminary_hearing", "notice_issued"].includes(c.status)
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium">{c.title}</p>
                            <p className="text-xs text-muted">
                              {c.case_number} • Your lawyer must file a written statement
                            </p>
                          </div>
                          <Link href={`/cases/${c.id}?tab=written_statement`}>
                            <Button size="sm" variant="outline">
                              View Written Statement
                            </Button>
                          </Link>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

            {/* Defendant: Pending lawyer fee payments */}
            {role === "client" && payments.some((p) => p.payer_id === user?.id && p.status === "pending") && (
              <Card>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
                  <CreditCard className="h-5 w-5" />
                  Lawyer Fee Awaiting Payment
                </h3>
                <div className="space-y-3">
                  {payments
                    .filter((p) => p.payer_id === user?.id && p.status === "pending")
                    .map((p) => (
                      <div key={p.id} className="rounded-lg border border-border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{p.case?.title || "—"}</p>
                          <p className="text-xs text-muted">{p.case?.case_number} • {(p.receiver as { full_name: string } | null)?.full_name || "Lawyer"}</p>
                          <p className="mt-1 text-sm font-medium text-primary">{formatCurrency(Number(p.amount))}</p>
                        </div>
                        <Link href="/payments">
                          <Button size="sm" variant="primary">
                            <CreditCard className="h-4 w-4" />
                            Pay Now
                          </Button>
                        </Link>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Client: Awaiting Payment */}
            {role === "client" && awaitingPayment.length > 0 && (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <Clock className="h-5 w-5" />
                      Cases Awaiting Initial Payment
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Make your first payment to start case processing. You can pay remaining installments later.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Syncing..." : "Refresh Status"}
                  </Button>
                </div>
                <div className="space-y-3">
                  {awaitingPayment.map((c) => {
                    const assignment = c.assignments?.find(
                      (a) => a.status === "accepted"
                    );
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted">
                            {c.case_number} • Lawyer:{" "}
                            {assignment?.lawyer?.full_name || "—"}
                          </p>
                          {assignment?.fee_amount && (
                            <p className="mt-1 text-sm font-medium text-primary">
                              Fee: {formatCurrency(assignment.fee_amount)}
                              {assignment.allow_installments &&
                                assignment.installment_count > 1 && (
                                  <span className="ml-1 text-xs text-muted">
                                    ({assignment.installment_count} installments - case starts after 1st payment)
                                  </span>
                                )}
                            </p>
                          )}
                        </div>
                        <Link href="/payments">
                          <Button size="sm">
                            <CreditCard className="h-4 w-4" />
                            Pay to Start
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Admin Court: Pending Scrutiny Queue */}
            {role === "admin_court" &&
              pendingScrutiny.length > 0 && (
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <ClipboardCheck className="h-5 w-5" />
                      Pending Scrutiny
                    </h3>
                    <Link href="/cases/scrutiny">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {pendingScrutiny.slice(0, 5).map((c) => (
                      <Link
                        key={c.id}
                        href={`/cases/${c.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                            <FileText className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted">
                              {c.case_number} • {c.case_type}
                            </p>
                          </div>
                        </div>
                        <Badge variant="warning">
                          {CASE_STATUS_LABELS[c.status as CaseStatus] || c.status.replace(/_/g, " ")}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

            {/* Admin Court: Cases awaiting summons issuance */}
            {role === "admin_court" &&
              cases.filter((c) => c.status === "registered").length > 0 && (
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <FileText className="h-5 w-5" />
                      Awaiting Summons
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Action Required
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted">
                    These cases are registered. Issue a summons to notify the defendant and schedule the preliminary hearing.
                  </p>
                  <div className="space-y-3">
                    {cases
                      .filter((c) => c.status === "registered")
                      .slice(0, 5)
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted">
                              {c.case_number} · {c.case_type}
                            </p>
                          </div>
                          <Badge variant="primary">Issue Summons</Badge>
                        </Link>
                      ))}
                  </div>
                </Card>
              )}

            {/* Lawyer: Cases ready to draft / submit */}
            {role === "lawyer" &&
              cases.filter(
                (c) =>
                  ["drafting", "returned_for_revision"].includes(c.status) &&
                  c.assignments?.some(
                    (a) => a.lawyer_id === user?.id && a.status === "accepted"
                  )
              ).length > 0 && (
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <PenLine className="h-5 w-5" />
                      Cases to Draft &amp; Submit
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Action Required
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted">
                    These cases are waiting for you to draft the plaint/petition and submit to the court.
                  </p>
                  <div className="space-y-3">
                    {cases
                      .filter(
                        (c) =>
                          ["drafting", "returned_for_revision"].includes(c.status) &&
                          c.assignments?.some(
                            (a) => a.lawyer_id === user?.id && a.status === "accepted"
                          )
                      )
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted">{c.case_number}</p>
                          </div>
                          <Badge variant={c.status === "returned_for_revision" ? "warning" : "primary"}>
                            {c.status === "returned_for_revision" ? "Revision Required" : "Draft Pending"}
                          </Badge>
                        </Link>
                      ))}
                  </div>
                </Card>
              )}

            {/* Lawyer: Upcoming hearings */}
            {role === "lawyer" &&
              (() => {
                const now = new Date();
                const upcoming = cases
                  .filter(
                    (c) =>
                      c.next_hearing_date &&
                      new Date(c.next_hearing_date) >= now &&
                      c.assignments?.some(
                        (a) => a.lawyer_id === user?.id && a.status === "accepted"
                      )
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.next_hearing_date!).getTime() -
                      new Date(b.next_hearing_date!).getTime()
                  );
                if (upcoming.length === 0) return null;
                return (
                  <Card>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <Calendar className="h-5 w-5" />
                        Upcoming Hearings
                      </h3>
                      <Link href="/cases">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {upcoming.slice(0, 5).map((c) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted">{c.case_number}</p>
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {formatDate(c.next_hearing_date!)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </Card>
                );
              })()}

            {/* Trial Judge: Upcoming hearings */}
            {role === "trial_judge" &&
              (() => {
                const now = new Date();
                const upcoming = trialCases
                  .filter((c) => c.next_hearing_date && new Date(c.next_hearing_date) >= now)
                  .sort(
                    (a, b) =>
                      new Date(a.next_hearing_date!).getTime() -
                      new Date(b.next_hearing_date!).getTime()
                  );
                if (upcoming.length === 0) return null;
                return (
                  <Card>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <Calendar className="h-5 w-5" />
                        Upcoming Hearings
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {upcoming.slice(0, 5).map((c) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted">{c.case_number}</p>
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {formatDate(c.next_hearing_date!)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </Card>
                );
              })()}

            {/* Stenographer: Today's Hearings */}
            {role === "stenographer" && (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Calendar className="h-5 w-5" />
                    Today&apos;s Hearings
                  </h3>
                  <Link href="/stenographer/today">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                {(() => {
                  const today = new Date();
                  const todayHearings = stenoRows
                    .filter((r) => {
                      const d = new Date(r.hearing.scheduled_date);
                      return (
                        d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate()
                      );
                    })
                    .sort(
                      (a, b) =>
                        new Date(a.hearing.scheduled_date).getTime() -
                        new Date(b.hearing.scheduled_date).getTime()
                    );

                  if (todayHearings.length === 0) {
                    return (
                      <p className="text-sm text-muted">
                        No hearings scheduled for today on your assigned cases.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {todayHearings.slice(0, 5).map(({ hearing, transcript }) => (
                        <Link
                          key={hearing.id}
                          href={`/cases/${hearing.case_id}/hearings/${hearing.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {hearing.case?.title}
                              </p>
                              <p className="text-xs text-muted">
                                {hearing.case?.case_number} · Hearing #
                                {hearing.hearing_number}
                                {hearing.courtroom && (
                                  <>
                                    {" · "}
                                    <MapPin className="inline h-3 w-3" />{" "}
                                    {hearing.courtroom}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          {transcript?.status === "signed" ? (
                            <Badge variant="success">
                              <Lock className="mr-1 inline h-3 w-3" />
                              Signed
                            </Badge>
                          ) : transcript ? (
                            <Badge variant="warning">Draft</Badge>
                          ) : (
                            <Badge variant="default">Pending</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Trial Judge: Active Trial Cases */}
            {role === "trial_judge" && trialCases.length > 0 && (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Scale className="h-5 w-5" />
                    Active Trial Cases
                  </h3>
                  <Link href="/cases">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {trialCases.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/cases/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Gavel className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {c.title}
                          </p>
                          <p className="text-xs text-muted">
                            {c.case_number}
                            {c.next_hearing_date &&
                              ` • Next: ${formatDate(c.next_hearing_date)}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary">
                        {CASE_STATUS_LABELS[c.status as CaseStatus] || c.status.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Trial Judge: Reserved for Judgment — highlighted action list */}
            {role === "trial_judge" &&
              trialCases.filter((c) => c.status === "reserved_for_judgment").length > 0 && (
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-700">
                      <Gavel className="h-5 w-5" />
                      Pending Judgment
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Action Required
                    </span>
                  </div>
                  <div className="space-y-3">
                    {trialCases
                      .filter((c) => c.status === "reserved_for_judgment")
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted">{c.case_number}</p>
                          </div>
                          {/* <Badge variant="secondary">Reserved</Badge> */}
                        </Link>
                      ))}
                  </div>
                </Card>
              )}

            {/* Recent cases (all roles) */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  Recent Cases
                </h3>
                <Link href="/cases">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              {casesLoading ? (
                <SkeletonList rows={4} />
              ) : cases.length === 0 ? (
                <p className="text-sm text-muted">
                  {role === "client"
                    ? "No cases yet. Create your first case to get started."
                    : "Cases assigned to you will appear here."}
                </p>
              ) : (
                <div className="space-y-3">
                  {cases.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/cases/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {c.status === "payment_confirmed" ||
                          c.status === "registered" ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : c.status === "payment_pending" ? (
                            <Clock className="h-5 w-5 text-warning" />
                          ) : c.status === "judgment_delivered" ? (
                            <Gavel className="h-5 w-5 text-success" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {c.title}
                          </p>
                          <p className="text-xs text-muted">{c.case_number}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          c.status === "draft"
                            ? "default"
                            : c.status === "judgment_delivered"
                              ? "success"
                              : c.status.includes("pending")
                                ? "warning"
                                : "primary"
                        }
                      >
                        {CASE_STATUS_LABELS[c.status as CaseStatus] || c.status.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Side column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h3 className="mb-4 text-base font-semibold text-primary">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {role === "client" && (
                  <>
                    <Link href="/cases/new" className="block">
                      <Button variant="primary" className="w-full justify-start">
                        <Briefcase className="h-4 w-4" />
                        File New Case
                      </Button>
                    </Link>
                    <Link href="/lawyers" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4" />
                        Find a Lawyer
                      </Button>
                    </Link>
                  </>
                )}
                {role === "lawyer" && (
                  <>
                    <Link href="/cases" className="block">
                      <Button variant="primary" className="w-full justify-start">
                        <Briefcase className="h-4 w-4" />
                        View My Cases
                      </Button>
                    </Link>
                    <Link href="/payments" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <CreditCard className="h-4 w-4" />
                        Payments
                      </Button>
                    </Link>
                    <Link href="/ai-assistant" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Bot className="h-4 w-4" />
                        AI Assistant
                      </Button>
                    </Link>
                  </>
                )}
                {role === "admin_court" && (
                  <>
                    <Link href="/cases/scrutiny" className="block">
                      <Button variant="primary" className="w-full justify-start">
                        <ClipboardCheck className="h-4 w-4" />
                        Scrutiny Queue
                      </Button>
                    </Link>
                    <Link href="/cases" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Briefcase className="h-4 w-4" />
                        All Cases
                      </Button>
                    </Link>
                  </>
                )}
                {role === "trial_judge" && (
                  <>
                    <Link href="/cases" className="block">
                      <Button variant="primary" className="w-full justify-start">
                        <Gavel className="h-4 w-4" />
                        Trial Cases
                      </Button>
                    </Link>
                    <Link href="/cases" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Scale className="h-4 w-4" />
                        View All Cases
                      </Button>
                    </Link>
                  </>
                )}
                {role === "stenographer" && (
                  <>
                    <Link href="/stenographer/today" className="block">
                      <Button variant="primary" className="w-full justify-start">
                        <Calendar className="h-4 w-4" />
                        Today&apos;s Hearings
                      </Button>
                    </Link>
                    <Link href="/stenographer/transcripts" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4" />
                        Transcripts
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/notifications" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="danger" className="ml-auto">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-primary">
                  Recent Notifications
                </h3>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg border p-3 ${
                        n.is_read
                          ? "border-border"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Case Summary */}
            <Card>
              <h3 className="mb-4 text-base font-semibold text-primary">
                Case Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total Cases</span>
                  <span className="text-sm font-semibold text-foreground">
                    {cases.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Active</span>
                  <span className="text-sm font-semibold text-success">
                    {activeCases}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Closed/Disposed</span>
                  <span className="text-sm font-semibold text-foreground">
                    {closedCases}
                  </span>
                </div>
                {pendingPayments > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Pending Payments</span>
                    <span className="text-sm font-semibold text-warning">
                      {pendingPayments}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
