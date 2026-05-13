"use client";

import { use, useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import CaseTimeline from "@/components/features/cases/CaseTimeline";
import ScrutinyChecklistComponent from "@/components/features/scrutiny/ScrutinyChecklist";
import BailApplicationForm from "@/components/features/criminal/BailApplicationForm";
import InvestigationPanel from "@/components/features/criminal/InvestigationPanel";
import EvidencePanel from "@/components/features/trial/EvidencePanel";
import WitnessPanel from "@/components/features/trial/WitnessPanel";
import JudgmentPanel from "@/components/features/trial/JudgmentPanel";
import DecreePanel from "@/components/features/trial/DecreePanel";
import AppealPanel from "@/components/features/trial/AppealPanel";
import ExecutionPanel from "@/components/features/trial/ExecutionPanel";
import { useDecree } from "@/hooks/useDecree";
import { useJudgment } from "@/hooks/useJudgment";
import DocumentList from "@/components/features/documents/DocumentList";
import UploadDocumentModal from "@/components/features/documents/UploadDocumentModal";
import AIDraftingModal from "@/components/features/documents/AIDraftingModal";
import JudgeDrafts from "@/components/features/cases/JudgeDrafts";
import IssueFraming from "@/components/features/cases/IssueFraming";
import WrittenStatementPanel from "@/components/features/cases/WrittenStatementPanel";
import { useCaseIssues } from "@/hooks/useCaseIssues";
import { createClient } from "@/lib/supabase/client";
import { useCase, useCases } from "@/hooks/useCases";
import { useHearings } from "@/hooks/useHearings";
import { useActivityLog, getActionLabel } from "@/hooks/useActivityLog";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import type { CriminalCaseDetailsExtended } from "@/types/criminal";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/lib/constants";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Clock,
  Shield,
  AlertTriangle,
  Briefcase,
  Send,
  Gavel,
  ClipboardCheck,
  ArrowRightCircle,
  Scale,
  Search,
  FileCheck2,
  FileBox,
  Users2,
  MessageSquareText,
  Trash2,
  CheckCircle2,
  RotateCcw,
  PauseCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "overview" | "documents" | "parties" | "hearings" | "scrutiny" | "bail" | "investigation" | "issues" | "evidence" | "witnesses" | "judgment" | "decree" | "appeals" | "execution" | "timeline" | "my_drafts" | "written_statement" | "activity";

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { caseData, documents, isLoading, refreshCase } = useCase(caseId);
  const { submitToAdmin, startDrafting, issueSummon, updateCaseStatus, submitChallan, uploadDocument, deleteDocument, getDocumentUrl, withdrawCase, acknowledgeSummon } = useCases();
  const { requests: docRequests, createRequest: createDocRequest, fulfillRequest: fulfillDocRequest } = useDocumentRequests(caseId);
  const { hearings, assignJudge, assignStenographer, rescheduleHearing } = useHearings(caseId);
  const { issues } = useCaseIssues(caseId);
  const { judgment } = useJudgment(caseId);
  const { decree } = useDecree(caseId);
  const { payments, syncCasePaymentStatus, isLoading: paymentsLoading } = usePayments();
  const { logs: activityLogs, isLoading: activityLoading } = useActivityLog(caseId);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAssignJudgeDialog, setShowAssignJudgeDialog] = useState(false);
  const [judgeList, setJudgeList] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [assignJudgeLoading, setAssignJudgeLoading] = useState(false);
  const [assignJudgeError, setAssignJudgeError] = useState("");
  const [showAssignStenoDialog, setShowAssignStenoDialog] = useState(false);
  const [stenoList, setStenoList] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedStenoId, setSelectedStenoId] = useState("");
  const [assignStenoLoading, setAssignStenoLoading] = useState(false);
  const [assignStenoError, setAssignStenoError] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  // true while we're attempting to auto-link this user as defendant
  const [isLinkingDefendant, setIsLinkingDefendant] = useState(false);
  // set to true once the auto-link attempt has finished (so we don't retry forever)
  const [linkAttempted, setLinkAttempted] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showSummonDialog, setShowSummonDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleHearingId, setRescheduleHearingId] = useState("");
  const [rescheduleNewDate, setRescheduleNewDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [showDocRequestDialog, setShowDocRequestDialog] = useState(false);
  const [docRequestForm, setDocRequestForm] = useState({ requested_from: "", document_type: "written_statement", title: "", description: "" });
  const [docRequestLoading, setDocRequestLoading] = useState(false);
  const [docRequestError, setDocRequestError] = useState("");
  const [summonResult, setSummonResult] = useState<{ defendant_name: string; defendant_email: string | null; email_sent: boolean; notification_sent: boolean; register_url: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalDefaultDocType, setUploadModalDefaultDocType] = useState<string | undefined>(undefined);
  const [showAIDraftingModal, setShowAIDraftingModal] = useState(false);
  const [aiDraftingDocType, setAiDraftingDocType] = useState<string | undefined>(undefined);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [casePayments, setCasePayments] = useState<any[]>([]);

  // When a client lands on this page and the case isn't found, try to auto-link
  // them as defendant (their email might match but defendant_id is still NULL).
  // Runs once, after loading finishes, only when caseData is null.
  useEffect(() => {
    if (isLoading) return;
    if (caseData) return;
    if (user?.role !== "client") return;
    if (linkAttempted) return;

    setIsLinkingDefendant(true);
    fetch("/api/cases/link-defendant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.linked > 0) {
          refreshCase();
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLinkingDefendant(false);
        setLinkAttempted(true);
      });
  }, [isLoading, caseData, user?.role, linkAttempted, refreshCase]);

  // Fetch payments directly for this case to avoid RLS/hook issues
  useEffect(() => {
    async function checkCasePayments() {
      if (!caseId) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("payments")
          .select("id, status, amount")
          .eq("case_id", caseId);
        
        console.log("[CaseDetail] Direct payment fetch for case:", caseId, "results:", data?.length || 0, "payments");
        if (data) {
          setCasePayments(data);
          const completed = data.filter(p => p.status === "completed").length;
          console.log("[CaseDetail] Completed payments:", completed);
        }
        if (error) {
          console.error("[CaseDetail] Payment fetch error:", error);
        }
      } catch (err) {
        console.error("[CaseDetail] Payment check error:", err);
      }
    }
    checkCasePayments();
  }, [caseId, caseData?.status]);

  // Check if case is stuck in payment_pending with completed payments
  const hasCompletedPayments = casePayments.some((p) => p.status === "completed");
  const isPaymentStuck = caseData?.status === "payment_pending" && hasCompletedPayments;

  console.log("[CaseDetail] Payment stuck check:", { 
    caseStatus: caseData?.status, 
    hasCompletedPayments, 
    isPaymentStuck,
    totalPayments: casePayments.length,
    syncFunctionExists: typeof syncCasePaymentStatus !== 'undefined'
  });

  const handleSyncPaymentStatus = async () => {
    alert("Button clicked!"); // Simple test
    console.log("[CaseDetail] 🔘 Button clicked! Starting sync...");
    setIsSyncingPayment(true);
    setActionError("");
    
    try {
      console.log("[CaseDetail] Syncing payment status for case", caseId);
      const result = await syncCasePaymentStatus(caseId);
      console.log("[CaseDetail] Sync result:", JSON.stringify(result, null, 2));
      
      if (result.updated) {
        console.log("[CaseDetail] ✅ Case updated! Refreshing...");
        await refreshCase();
        // Reload the page to show updated status
        window.location.reload();
      } else if (result.error) {
        console.error("[CaseDetail] ❌ Sync error:", result.error);
        setActionError(result.error);
      } else {
        console.log("[CaseDetail] ℹ️ No update needed");
        setActionError("No update was needed. Case may already be updated.");
      }
    } catch (err) {
      console.error("[CaseDetail] ❌ Sync exception:", err);
      setActionError(`Failed to sync: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSyncingPayment(false);
      console.log("[CaseDetail] Sync complete");
    }
  };

  if (isLoading) {
    return (
      <div>
        <Topbar title="Case Details" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    // Show spinner while we're trying to auto-link this user as defendant
    if (isLinkingDefendant) {
      return (
        <div>
          <Topbar title="Case Details" />
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Spinner size="lg" />
            <p className="text-sm text-muted">Linking your account to this case…</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Topbar title="Case Details" />
        <div className="p-6">
          <EmptyState
            title="Case not found"
            description="This case may have been removed or you don't have access."
            icon={<Briefcase className="h-12 w-12" />}
            action={
              <Link href="/cases">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Cases
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const isLawyer = user?.role === "lawyer";
  const isDefendant = user?.role === "client" && user?.id === caseData.defendant_id;
  const isCourtOfficial = user && ["admin_court", "trial_judge", "stenographer"].includes(user.role);
  const status = caseData.status as CaseStatus;

  // Show scrutiny tab for admin court or when case is in scrutiny-related statuses
  const showScrutinyTab = isCourtOfficial || [
    "submitted_to_admin", "under_scrutiny", "returned_for_revision", "registered",
    "summon_issued", "preliminary_hearing", "issues_framed", "transferred_to_trial",
    "stayed", "withdrawn",
  ].includes(status);

  // Show hearings tab when case is past registration (incl. any terminal branches)
  const showHearingsTab = [
    "registered", "summon_issued", "preliminary_hearing", "issues_framed",
    "transferred_to_trial", "evidence_stage", "arguments",
    "reserved_for_judgment", "judgment_delivered",
    "stayed", "remanded", "under_execution", "satisfied", "appeal_filed",
    "closed", "withdrawn", "disposed",
  ].includes(status);

  // Show bail and investigation tabs for criminal cases
  const isCriminalCase = caseData.case_type === "criminal";
  const isMagistrate = false;
  const isTrialJudge = user?.role === "trial_judge";
  const isStenographer = user?.role === "stenographer";
  const isAdminCourt = user?.role === "admin_court";
  const criminalDetails = caseData.criminal_details as CriminalCaseDetailsExtended | null;

  // Admin Court's jurisdiction ends once the case is transferred to trial.
  // After that point they can view the case but should not take any actions
  // or see judge/steno-specific tabs.
  const adminCourtActiveStatuses = [
    "submitted_to_admin", "under_scrutiny", "returned_for_revision",
    "registered", "summon_issued", "preliminary_hearing", "issues_framed",
  ];
  const isAdminCourtActive = isAdminCourt && adminCourtActiveStatuses.includes(status);

  // Show trial court tabs (evidence, witnesses, judgment) when case is in trial phase or post-judgment
  // Admin Court does NOT see these tabs — they belong to the Judge/Steno workflow.
  const showTrialTabs = [
    "transferred_to_trial", "evidence_stage", "arguments",
    "reserved_for_judgment", "judgment_delivered",
    "remanded", "under_execution", "satisfied", "appeal_filed",
    "closed",
  ].includes(status) && !isAdminCourt;

  // Show issues tab once the case reaches preliminary hearing.
  // For Admin Court, only show during pre-transfer statuses.
  const showIssuesTab = isAdminCourt
    ? ["preliminary_hearing", "issues_framed"].includes(status)
    : [
        "preliminary_hearing", "issues_framed", "transferred_to_trial",
        "evidence_stage", "arguments", "reserved_for_judgment",
        "judgment_delivered", "under_execution", "satisfied",
        "appeal_filed", "remanded", "closed", "disposed",
      ].includes(status);

  const showDecreeTab = !isAdminCourt && [
    "judgment_delivered", "under_execution", "satisfied",
    "appeal_filed", "closed", "disposed",
  ].includes(status);

  const showAppealTab = !isAdminCourt && [
    "judgment_delivered", "under_execution", "satisfied",
    "appeal_filed", "closed", "disposed",
  ].includes(status);

  const showExecutionTab =
    !isAdminCourt &&
    !!decree && ["signed", "executed", "pending_execution", "satisfied"].includes(decree.status);

  // Show written statement tab once summon is issued (defendant has been notified)
  const showWrittenStatementTab = [
    "summon_issued", "preliminary_hearing", "issues_framed", "transferred_to_trial",
    "evidence_stage", "arguments", "reserved_for_judgment", "judgment_delivered",
    "under_execution", "satisfied", "appeal_filed", "remanded",
    "closed", "disposed",
  ].includes(status);

  // Determine if the current user is the defendant's lawyer
  const isDefendantLawyer =
    isLawyer &&
    !!(caseData.assignments?.find(
      (a) => a.side === "defendant" && a.status === "accepted" && a.lawyer?.id === user?.id
    ));

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: `Documents (${documents.length})` },
    { id: "parties", label: "Parties" },
    ...(isCriminalCase ? [{ id: "bail" as Tab, label: "Bail" }] : []),
    ...(isCriminalCase ? [{ id: "investigation" as Tab, label: "Investigation" }] : []),
    ...(showHearingsTab ? [{ id: "hearings" as Tab, label: `Hearings (${hearings.length})` }] : []),
    ...(showIssuesTab ? [{ id: "issues" as Tab, label: `Issues (${issues.length})` }] : []),
    // Scrutiny tab: hidden for stenographer and trial_judge
    ...(showScrutinyTab && !isStenographer && !isTrialJudge ? [{ id: "scrutiny" as Tab, label: "Scrutiny" }] : []),
    ...(showTrialTabs ? [{ id: "evidence" as Tab, label: "Evidence" }] : []),
    ...(showTrialTabs ? [{ id: "witnesses" as Tab, label: "Witnesses" }] : []),
    ...(showTrialTabs ? [{ id: "judgment" as Tab, label: "Judgment" }] : []),
    ...(showDecreeTab ? [{ id: "decree" as Tab, label: "Decree" }] : []),
    // Appeals tab: hidden for stenographer and admin_court
    ...(!isStenographer && !isAdminCourt && showAppealTab ? [{ id: "appeals" as Tab, label: "Appeals" }] : []),
    ...(showExecutionTab ? [{ id: "execution" as Tab, label: "Execution" }] : []),
    // Written Statement tab: hidden for stenographer and trial_judge
    ...(showWrittenStatementTab && !isStenographer && !isTrialJudge ? [{ id: "written_statement" as Tab, label: "Written Statement" }] : []),
    { id: "timeline", label: "Timeline" },
    ...(isTrialJudge ? [{ id: "my_drafts" as Tab, label: "My Drafts" }] : []),
    { id: "activity" as Tab, label: "Activity" },
  ];

  const handleAction = async (action: () => Promise<{ error: string | null }>) => {
    setIsActionLoading(true);
    setActionError("");
    const result = await action();
    if (result.error) {
      setActionError(result.error);
    } else {
      await refreshCase();
    }
    setIsActionLoading(false);
  };

  const statusSteps = [
    "registered",            // Step 1: Filing of Plaint
    "summon_issued",         // Step 2: Issue of Summons
    "preliminary_hearing",   // Step 3: Written Statement
    "issues_framed",         // Step 4: Framing of Issues
    "evidence_stage",        // Step 5: Evidence Stage
    "arguments",             // Step 6: Final Arguments
    "judgment_delivered",    // Step 7: Judgment Delivered & Decree
  ];
  // reserved_for_judgment is treated as a sub-status of step 7
  const resolvedStatus = caseData.status === "reserved_for_judgment" ? "judgment_delivered" : caseData.status;
  const currentStepIndex = statusSteps.indexOf(resolvedStatus);

  return (
    <div>
      <Topbar title={caseData.case_number} />

      <div className="p-6">
        {/* Back link */}
        <Link
          href="/cases"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>

        {actionError && (
          <div className="mt-2 rounded-lg border border-danger bg-danger-light p-3 text-sm text-danger">
            {actionError}
          </div>
        )}

        {/* Payment Stuck Alert */}
        {isPaymentStuck && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">
                    Payment Completed - Case Status Update Needed
                  </h3>
                  <p className="mt-1 text-sm text-amber-800">
                    You've completed at least one payment, but the case status hasn't been updated yet. 
                    Click the button to update your case from "Payment Pending" to "Payment Confirmed" so it can proceed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log("[CaseDetail] 🔘 RAW BUTTON CLICKED!");
                  handleSyncPaymentStatus();
                }}
                disabled={isSyncingPayment}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {isSyncingPayment ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        )}

        {/* Defendant: Summon Acknowledgment Banner */}
        {isDefendant && status === "summon_issued" && (
          <div className="mt-2 rounded-xl border-2 border-warning bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/20">
                <Gavel className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900">
                  A Court Case Has Been Filed Against You
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  You have been officially summoned to appear in this case. Please review the details below and acknowledge receipt of the summon to proceed.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-amber-200 bg-white p-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-amber-900">Case Number:</span>{" "}
                    <span className="text-foreground">{caseData.case_number}</span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-900">Case Type:</span>{" "}
                    <span className="capitalize text-foreground">{caseData.case_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-900">Plaintiff:</span>{" "}
                    <span className="text-foreground">{caseData.plaintiff?.full_name ?? "—"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-900">Filed On:</span>{" "}
                    <span className="text-foreground">{caseData.filing_date ? formatDate(caseData.filing_date) : "—"}</span>
                  </div>
                  {caseData.relief_sought && (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-amber-900">Relief Sought:</span>{" "}
                      <span className="text-foreground">{caseData.relief_sought}</span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm text-amber-800">
                  <strong>Your next steps:</strong> Acknowledge the summon, hire a lawyer to represent you, and submit your written statement within the prescribed time.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="warning"
                    isLoading={isActionLoading}
                    onClick={() =>
                      handleAction(() => acknowledgeSummon(caseId))
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Acknowledge Summon &amp; Proceed
                  </Button>
                  <Link href="/lawyers">
                    <Button variant="outline">
                      <Users className="h-4 w-4" />
                      Hire a Lawyer
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Defendant: post-acknowledgment — case is now in preliminary hearing, show guidance */}
        {isDefendant && status === "preliminary_hearing" && !caseData.assignments?.some((a) => a.side === "defendant" && a.status !== "declined") && (
          <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-primary">Action Required: Hire a Lawyer</h3>
                <p className="mt-1 text-sm text-muted">
                  The case has moved to the Preliminary Hearing stage. You should hire a lawyer to represent you and submit your written statement.
                </p>
                <div className="mt-3 flex gap-3">
                  <Link href="/lawyers">
                    <Button size="sm" variant="primary">
                      <Users className="h-4 w-4" />
                      Browse &amp; Hire a Lawyer
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("written_statement")}>
                    <FileText className="h-4 w-4" />
                    View Written Statement
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case header */}
        <Card className="mt-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-primary">
                  {caseData.title}
                </h2>
                <StatusBadge status={caseData.status as CaseStatus} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {caseData.case_number}
                </span>
                <span>
                  <Badge
                    variant={
                      caseData.case_type === "civil" ? "primary" : caseData.case_type === "family" ? "warning" : "danger"
                    }
                  >
                    {caseData.case_type === "civil" ? "Civil" : caseData.case_type === "family" ? "Family" : "Criminal"}
                  </Badge>
                </span>
                {caseData.filing_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Filed: {formatDate(caseData.filing_date)}
                  </span>
                )}
                {caseData.sensitivity !== "normal" && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-warning" />
                    {caseData.sensitivity.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Filing</span>
              <span>Summons</span>
              <span>Evidence</span>
              <span>Judgment</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
              <div
                className={`h-full rounded-full bg-primary transition-all [width:${currentStepIndex === -1 ? 3 : Math.max(5, ((currentStepIndex + 1) / statusSteps.length) * 100)}%]`}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {caseData.status === "reserved_for_judgment"
                ? "Judge Reserved Order (Step 7)"
                : currentStepIndex === -1
                  ? "Pre-registration — "
                  : `Step ${currentStepIndex + 1} of ${statusSteps.length} — `}
              {CASE_STATUS_LABELS[caseData.status as CaseStatus] ||
                caseData.status}
            </p>
          </div>

          {/* Phase 5 Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {/* Lawyer: Start Drafting */}
            {isLawyer && status === "payment_confirmed" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() => handleAction(() => startDrafting(caseId))}
              >
                <FileText className="h-4 w-4" />
                Start Drafting
              </Button>
            )}

            {/* Lawyer: Submit to Admin Court */}
            {isLawyer && ["drafting", "returned_for_revision"].includes(status) && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() => handleAction(() => submitToAdmin(caseId))}
              >
                <Send className="h-4 w-4" />
                Submit to Admin Court
              </Button>
            )}

            {/* Admin Court: Begin Scrutiny */}
            {isAdminCourtActive && status === "submitted_to_admin" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveTab("scrutiny")}
              >
                <ClipboardCheck className="h-4 w-4" />
                Begin Scrutiny
              </Button>
            )}

            {/* Admin Court: Issue Summon */}
            {isAdminCourtActive && status === "registered" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowSummonDialog(true)}
              >
                <Gavel className="h-4 w-4" />
                Issue Summon
              </Button>
            )}

            {/* Admin Court: Assign Judge (only within admin court active statuses) */}
            {isAdminCourtActive && ["registered", "summon_issued", "preliminary_hearing", "issues_framed"].includes(status) && (
              <Button
                size="sm"
                variant={caseData.trial_judge_id ? "outline" : "warning"}
                onClick={async () => {
                  setAssignJudgeError("");
                  setSelectedJudgeId(caseData.trial_judge_id ?? "");
                  const supabase = createClient();
                  const { data } = await supabase
                    .from("profiles")
                    .select("id, full_name, email")
                    .in("role", ["trial_judge"])
                    .order("full_name");
                  setJudgeList(data ?? []);
                  setShowAssignJudgeDialog(true);
                }}
              >
                <Users className="h-4 w-4" />
                {caseData.trial_judge_id ? "Change Judge" : "Assign Judge"}
              </Button>
            )}

            {/* Trial Judge / Stenographer: Assign Stenographer (post-transfer)
                Admin Court: only during their active pre-transfer statuses */}
            {(
              (!isAdminCourt && isCourtOfficial && ["transferred_to_trial", "evidence_stage", "arguments"].includes(status)) ||
              (isAdminCourtActive && ["registered", "summon_issued", "preliminary_hearing", "issues_framed"].includes(status))
            ) && (
              <Button
                size="sm"
                variant={caseData.stenographer_id ? "outline" : "warning"}
                onClick={async () => {
                  setAssignStenoError("");
                  setSelectedStenoId(caseData.stenographer_id ?? "");
                  const supabase = createClient();
                  const { data } = await supabase
                    .from("profiles")
                    .select("id, full_name, email")
                    .eq("role", "stenographer")
                    .order("full_name");
                  setStenoList(data ?? []);
                  setShowAssignStenoDialog(true);
                }}
              >
                <MessageSquareText className="h-4 w-4" />
                {caseData.stenographer_id ? "Change Stenographer" : "Assign Stenographer"}
              </Button>
            )}

            {/* Admin Court: Advance through statuses */}
            {isAdminCourtActive && status === "summon_issued" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "preliminary_hearing", status))
                }
              >
                <ArrowRightCircle className="h-4 w-4" />
                Start Preliminary Hearing
              </Button>
            )}

            {isAdminCourtActive && status === "preliminary_hearing" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                disabled={issues.length === 0}
                title={
                  issues.length === 0
                    ? "Record at least one issue in the Issues tab first"
                    : undefined
                }
                onClick={() => {
                  if (issues.length === 0) {
                    setActionError(
                      "Frame at least one issue in the Issues tab before advancing."
                    );
                    setActiveTab("issues");
                    return;
                  }
                  handleAction(() =>
                    updateCaseStatus(caseId, "issues_framed", status)
                  );
                }}
              >
                <ArrowRightCircle className="h-4 w-4" />
                {issues.length === 0
                  ? "Frame Issues (0 recorded)"
                  : `Finalise Issues (${issues.length})`}
              </Button>
            )}

            {/* Admin Court: Dispose at preliminary hearing stage */}
            {isAdminCourtActive && status === "preliminary_hearing" && (
              <Button
                size="sm"
                variant="danger"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "disposed", status))
                }
              >
                <Trash2 className="h-4 w-4" />
                Dispose Case
              </Button>
            )}

            {isAdminCourtActive && status === "issues_framed" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "transferred_to_trial", status))
                }
              >
                <ArrowRightCircle className="h-4 w-4" />
                Transfer to Trial Court
              </Button>
            )}

            {/* Criminal: Submit Challan (only while admin court is active, or by judge/steno) */}
            {isCriminalCase && isCourtOfficial && !isAdminCourt && criminalDetails && !criminalDetails.challan_submitted && (
              <Button
                size="sm"
                variant="warning"
                isLoading={isActionLoading}
                onClick={() => handleAction(() => submitChallan(caseId))}
              >
                <FileCheck2 className="h-4 w-4" />
                Submit Challan
              </Button>
            )}

            {/* Criminal: View Bail Applications */}
            {isCriminalCase && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("bail")}
              >
                <Scale className="h-4 w-4" />
                Bail
              </Button>
            )}

            {/* Criminal: View Investigation */}
            {isCriminalCase && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("investigation")}
              >
                <Search className="h-4 w-4" />
                Investigation
              </Button>
            )}

            {/* Trial Court: Start Evidence Stage */}
            {isCourtOfficial && status === "transferred_to_trial" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "evidence_stage", status))
                }
              >
                <FileBox className="h-4 w-4" />
                Start Evidence Stage
              </Button>
            )}

            {/* Trial Court: Move to Arguments */}
            {isCourtOfficial && status === "evidence_stage" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "arguments", status))
                }
              >
                <MessageSquareText className="h-4 w-4" />
                Move to Arguments
              </Button>
            )}

            {/* Trial Court: Reserve for Judgment */}
            {isCourtOfficial && status === "arguments" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "reserved_for_judgment", status))
                }
              >
                <Gavel className="h-4 w-4" />
                Reserve for Judgment
              </Button>
            )}

            {/* Trial Court: Close Case */}
            {isCourtOfficial && !isAdminCourt && status === "judgment_delivered" && (
              <Button
                size="sm"
                variant="outline"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "closed", status))
                }
              >
                Close Case
              </Button>
            )}

            {/* Court Official / Trial Judge: Start decree execution */}
            {isCourtOfficial && !isAdminCourt && status === "judgment_delivered" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "under_execution", status))
                }
              >
                <ArrowRightCircle className="h-4 w-4" />
                Start Execution
              </Button>
            )}

            {/* Court Official / Trial Judge: Mark decree satisfied */}
            {isCourtOfficial && !isAdminCourt && status === "under_execution" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "satisfied", status))
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Satisfied
              </Button>
            )}

            {/* Trial Judge: Remand case for retrial */}
            {isCourtOfficial && !isAdminCourt && status === "judgment_delivered" && (
              <Button
                size="sm"
                variant="warning"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "remanded", status))
                }
              >
                <RotateCcw className="h-4 w-4" />
                Remand to Trial
              </Button>
            )}

            {/* Court Official: Re-start trial after remand */}
            {isCourtOfficial && !isAdminCourt && status === "remanded" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "transferred_to_trial", status))
                }
              >
                <ArrowRightCircle className="h-4 w-4" />
                Transfer to Trial (Retrial)
              </Button>
            )}

            {/* Court Official: Stay case proceedings
                Admin Court: only pre-transfer statuses; Judge/Steno: also post-transfer */}
            {isCourtOfficial &&
              (isAdminCourt
                ? ["registered", "summon_issued", "preliminary_hearing", "issues_framed"].includes(status)
                : ["registered", "summon_issued", "preliminary_hearing", "issues_framed",
                   "transferred_to_trial", "evidence_stage", "arguments"].includes(status)
              ) && (
              <Button
                size="sm"
                variant="warning"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "stayed", status))
                }
              >
                <PauseCircle className="h-4 w-4" />
                Stay Proceedings
              </Button>
            )}

            {/* Court Official: Lift stay — resume at registered */}
            {isCourtOfficial && !isAdminCourt && status === "stayed" && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "registered", status))
                }
              >
                <ArrowRightCircle className="h-4 w-4" />
                Lift Stay
              </Button>
            )}

            {/* Client / Lawyer: File appeal after judgment or closure */}
            {(user?.role === "client" || user?.role === "lawyer") && (status === "judgment_delivered" || status === "closed") && (
              <Button
                size="sm"
                variant="outline"
                isLoading={isActionLoading}
                onClick={() =>
                  handleAction(() => updateCaseStatus(caseId, "appeal_filed", status))
                }
              >
                <Scale className="h-4 w-4" />
                File Appeal
              </Button>
            )}

            {/* Defendant: Acknowledge summon */}
            {isDefendant && status === "summon_issued" && (
              <Button
                size="sm"
                variant="warning"
                isLoading={isActionLoading}
                onClick={() => handleAction(() => acknowledgeSummon(caseId))}
              >
                <CheckCircle2 className="h-4 w-4" />
                Acknowledge Summon
              </Button>
            )}

            {/* Trial Tabs shortcuts */}
            {showTrialTabs && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("evidence")}
                >
                  <FileBox className="h-4 w-4" />
                  Evidence
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("witnesses")}
                >
                  <Users2 className="h-4 w-4" />
                  Witnesses
                </Button>
              </>
            )}

            {/* View Hearings link */}
            {showHearingsTab && (
              <Link href={`/cases/${caseId}/hearings`}>
                <Button size="sm" variant="outline">
                  <Gavel className="h-4 w-4" />
                  View Hearings
                </Button>
              </Link>
            )}

            {/* Client: Withdraw case (any pre-judgment status) */}
            {user?.role === "client" &&
              user.id === caseData.plaintiff_id &&
              [
                "draft", "pending_lawyer_acceptance", "payment_pending",
                "payment_confirmed", "drafting", "submitted_to_admin",
                "under_scrutiny", "returned_for_revision", "registered",
                "summon_issued", "preliminary_hearing", "issues_framed",
                "transferred_to_trial", "evidence_stage", "arguments",
                "reserved_for_judgment", "stayed",
              ].includes(status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowWithdrawDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Withdraw Case
                </Button>
              )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Description */}
              <Card className="lg:col-span-2">
                <h3 className="mb-3 text-lg font-semibold text-primary">
                  Case Description
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {caseData.description || "No description provided."}
                </p>

                {caseData.relief_sought && (
                  <>
                    <h3 className="mt-5 mb-2 text-sm font-semibold text-primary">
                      Relief Sought by Plaintiff
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {caseData.relief_sought}
                    </p>
                  </>
                )}
              </Card>

              {/* Quick info */}
              <div className="space-y-4">
                <Card padding="sm">
                  <h4 className="mb-2 text-sm font-semibold text-primary">
                    Plaintiff
                  </h4>
                  <p className="text-sm">
                    {caseData.plaintiff?.full_name || "Not assigned"}
                  </p>
                  {caseData.plaintiff?.email && (
                    <p className="text-xs text-muted">
                      {caseData.plaintiff.email}
                    </p>
                  )}
                </Card>

                <Card padding="sm">
                  <h4 className="mb-2 text-sm font-semibold text-primary">
                    Defendant
                  </h4>
                  <p className="text-sm">
                    {caseData.defendant?.full_name || "Not assigned yet"}
                  </p>
                </Card>

                <Card padding="sm">
                  <h4 className="mb-2 text-sm font-semibold text-primary">
                    Assigned Lawyer
                  </h4>
                  {caseData.assignments && caseData.assignments.length > 0 ? (
                    caseData.assignments.map((a) => (
                      <div key={a.id} className="mb-2 text-sm last:mb-0">
                        <p className="font-medium">
                          {a.lawyer?.full_name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              a.status === "accepted"
                                ? "success"
                                : a.status === "declined"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {a.status}
                          </Badge>
                          <span className="capitalize text-xs text-muted">
                            ({a.side})
                          </span>
                        </div>
                        {a.fee_amount && (
                          <p className="mt-1 text-xs text-muted">
                            Fee: {formatCurrency(a.fee_amount)}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No lawyer assigned</p>
                  )}
                </Card>

                {caseData.next_hearing_date && (
                  <Card padding="sm">
                    <h4 className="mb-2 text-sm font-semibold text-primary">
                      Next Hearing
                    </h4>
                    <p className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      {formatDate(caseData.next_hearing_date)}
                    </p>
                  </Card>
                )}

                {caseData.trial_judge_id && (
                  <Card padding="sm">
                    <h4 className="mb-2 text-sm font-semibold text-primary">
                      <Gavel className="mr-1 inline h-4 w-4" />
                      Assigned Judge
                    </h4>
                    <p className="text-sm text-foreground">
                      {caseData.trial_judge?.full_name ?? "Assigned"}
                    </p>
                    {caseData.trial_judge?.email && (
                      <p className="text-xs text-muted">{caseData.trial_judge.email}</p>
                    )}
                    <Badge variant="success" className="mt-1">Active</Badge>
                  </Card>
                )}

                {caseData.stenographer_id && (
                  <Card padding="sm">
                    <h4 className="mb-2 text-sm font-semibold text-primary">
                      <MessageSquareText className="mr-1 inline h-4 w-4" />
                      Stenographer
                    </h4>
                    <p className="text-sm text-foreground">
                      {caseData.stenographer?.full_name ?? "Assigned"}
                    </p>
                    {caseData.stenographer?.email && (
                      <p className="text-xs text-muted">{caseData.stenographer.email}</p>
                    )}
                  </Card>
                )}
              </div>

              {/* Criminal details */}
              {isCriminalCase && criminalDetails && (
                  <Card className="lg:col-span-3">
                    <h3 className="mb-3 text-lg font-semibold text-primary">
                      <AlertTriangle className="mr-2 inline h-5 w-5" />
                      Criminal Case Details
                    </h3>
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
                      {criminalDetails.fir_number && (
                        <div>
                          <dt className="text-muted">FIR Number</dt>
                          <dd className="font-medium">
                            {criminalDetails.fir_number}
                          </dd>
                        </div>
                      )}
                      {criminalDetails.police_station && (
                        <div>
                          <dt className="text-muted">Police Station</dt>
                          <dd className="font-medium">
                            {criminalDetails.police_station}
                          </dd>
                        </div>
                      )}
                      {criminalDetails.offense_section && (
                        <div>
                          <dt className="text-muted">Section</dt>
                          <dd className="font-medium">
                            {criminalDetails.offense_section}
                          </dd>
                        </div>
                      )}
                      {criminalDetails.bail_status && (
                        <div>
                          <dt className="text-muted">Bail Status</dt>
                          <dd>
                            <Badge
                              variant={
                                criminalDetails.bail_status === "granted"
                                  ? "success"
                                  : criminalDetails.bail_status === "denied"
                                    ? "danger"
                                    : criminalDetails.bail_status === "applied"
                                      ? "warning"
                                      : "default"
                              }
                            >
                              {criminalDetails.bail_status.replace(/_/g, " ")}
                            </Badge>
                          </dd>
                        </div>
                      )}
                      {criminalDetails.investigation_status && (
                        <div>
                          <dt className="text-muted">Investigation Status</dt>
                          <dd>
                            <Badge
                              variant={
                                criminalDetails.investigation_status === "completed"
                                  ? "success"
                                  : criminalDetails.investigation_status === "in_progress"
                                    ? "warning"
                                    : "info"
                              }
                            >
                              {criminalDetails.investigation_status.replace(/_/g, " ")}
                            </Badge>
                          </dd>
                        </div>
                      )}
                      {criminalDetails.challan_submitted && (
                        <div>
                          <dt className="text-muted">Challan</dt>
                          <dd>
                            <Badge variant="success">Submitted</Badge>
                            {criminalDetails.challan_date && (
                              <span className="ml-2 text-xs text-muted">
                                {formatDate(criminalDetails.challan_date)}
                              </span>
                            )}
                          </dd>
                        </div>
                      )}
                      {criminalDetails.io_name && (
                        <div>
                          <dt className="text-muted">
                            Investigation Officer
                          </dt>
                          <dd className="font-medium">
                            {criminalDetails.io_name}
                            {criminalDetails.io_contact && (
                              <span className="ml-1 text-xs text-muted">
                                ({criminalDetails.io_contact})
                              </span>
                            )}
                          </dd>
                        </div>
                      )}
                      {criminalDetails.offense_description && (
                        <div className="sm:col-span-2 md:col-span-3">
                          <dt className="text-muted">Offense Description</dt>
                          <dd>
                            {criminalDetails.offense_description}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              {/* Final Arguments prompt — shown to lawyers when case is in arguments phase */}
              {isLawyer && caseData.status === "arguments" && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-primary">Submit Your Final Arguments</h4>
                      <p className="mt-1 text-sm text-muted">
                        The case is now in the final arguments phase. Upload your written arguments
                        or memorandum of arguments as a document. Both sides will present their
                        arguments before judgment is reserved.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setUploadModalDefaultDocType("final_arguments");
                        setShowUploadModal(true);
                      }}
                    >
                      Upload Final Arguments
                    </Button>
                  </div>
                </div>
              )}

              {/* Pending document requests banner — shown to the client who must fulfil them */}
              {docRequests.filter((r) => r.requested_from === user?.id && r.status === "pending").length > 0 && (
                <div className="rounded-lg border border-warning bg-amber-50 p-4">
                  <h4 className="mb-3 font-medium text-amber-900">Documents Requested by Your Lawyer</h4>
                  <div className="space-y-2">
                    {docRequests
                      .filter((r) => r.requested_from === user?.id && r.status === "pending")
                      .map((req) => (
                        <div key={req.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                          <div>
                            <p className="text-sm font-medium">{req.title}</p>
                            <p className="text-xs text-muted">
                              {req.document_type.replace(/_/g, " ")}
                              {req.description ? ` — ${req.description}` : ""}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => fulfillDocRequest(req.id)}>
                            Mark Uploaded
                          </Button>
                        </div>
                      ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Upload the file using the &quot;Upload File&quot; button above, then mark the request as fulfilled.
                  </p>
                </div>
              )}

              {/* AI Drafting & Document Request buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAiDraftingDocType(undefined);
                    setShowAIDraftingModal(true);
                  }}
                  className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/30"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Draft Document
                </Button>

                {isLawyer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const myAssignment = caseData.assignments?.find(
                        (a) => a.lawyer?.id === user?.id && a.status === "accepted"
                      );
                      const clientId =
                        myAssignment?.side === "defendant"
                          ? caseData.defendant_id
                          : caseData.plaintiff_id;
                      setDocRequestForm((f) => ({ ...f, requested_from: clientId ?? "" }));
                      setDocRequestError("");
                      setShowDocRequestDialog(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Request Document from Client
                  </Button>
                )}
              </div>

              {/* Main document list */}
              <DocumentList
                documents={documents}
                permissions={{
                  role: (user?.role ?? "client") as import("@/components/features/documents/DocumentList").DocumentRole,
                  currentUserId: user?.id ?? "",
                  isAssignedLawyer: isLawyer
                    ? !!(caseData.assignments?.find(
                        (a) => a.lawyer?.id === user?.id && a.status === "accepted"
                      ))
                    : undefined,
                }}
                onUploadClick={() => setShowUploadModal(true)}
                onDelete={deleteDocument}
                onGetUrl={getDocumentUrl}
                onRefresh={refreshCase}
              />

              {/* Document requests tracker — shown to the lawyer who made them */}
              {isLawyer && docRequests.length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 font-medium text-primary">Document Requests</h4>
                  <div className="space-y-2">
                    {docRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg bg-cream-light p-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{req.title}</span>
                          <span className="ml-2 text-xs text-muted">
                            → {(req.recipient as { full_name: string } | null)?.full_name ?? "Client"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            req.status === "fulfilled"
                              ? "success"
                              : req.status === "cancelled"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "parties" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <h3 className="mb-4 text-lg font-semibold text-primary">
                  <Users className="mr-2 inline h-5 w-5" />
                  Plaintiff Side
                </h3>
                {caseData.plaintiff ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium">
                        {caseData.plaintiff.full_name}
                      </p>
                      <p className="text-xs text-muted">
                        {caseData.plaintiff.email}
                      </p>
                      <Badge variant="info" className="mt-1">
                        Plaintiff
                      </Badge>
                    </div>
                    {caseData.assignments
                      ?.filter((a) => a.side === "plaintiff")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="text-sm font-medium">
                            {a.lawyer?.full_name || "Unknown Lawyer"}
                          </p>
                          <Badge
                            variant={
                              a.status === "accepted"
                                ? "success"
                                : a.status === "declined"
                                  ? "danger"
                                  : "warning"
                            }
                            className="mt-1"
                          >
                            Lawyer - {a.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Not assigned</p>
                )}
              </Card>

              <Card>
                <h3 className="mb-4 text-lg font-semibold text-primary">
                  <Users className="mr-2 inline h-5 w-5" />
                  Defendant Side
                </h3>
                {caseData.defendant ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium">
                        {caseData.defendant.full_name}
                      </p>
                      <p className="text-xs text-muted">
                        {caseData.defendant.email}
                      </p>
                      <Badge variant="warning" className="mt-1">
                        Defendant
                      </Badge>
                    </div>
                    {caseData.assignments
                      ?.filter((a) => a.side === "defendant")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="text-sm font-medium">
                            {a.lawyer?.full_name || "Unknown Lawyer"}
                          </p>
                          <Badge
                            variant={
                              a.status === "accepted"
                                ? "success"
                                : a.status === "declined"
                                  ? "danger"
                                  : "warning"
                            }
                            className="mt-1"
                          >
                            Lawyer - {a.status}
                          </Badge>
                          {a.status === "declined" && a.decline_reason && (
                            <p className="mt-1 text-xs text-muted">Reason: {a.decline_reason}</p>
                          )}
                          {a.fee_amount && a.status === "accepted" && (
                            <p className="mt-1 text-xs text-muted">
                              Fee: {formatCurrency(a.fee_amount)}
                              {a.allow_installments ? ` (${a.installment_count} installments)` : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    {/* Defendant: link to hire a lawyer if no active assignment */}
                    {user?.id === caseData.defendant_id &&
                      !caseData.assignments?.some((a) => a.side === "defendant" && a.status !== "declined") && (
                        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center">
                          <p className="text-xs text-muted mb-2">You have no active lawyer representation.</p>
                          <Link href="/lawyers">
                            <Button size="sm" variant="primary">
                              <Users className="h-4 w-4" />
                              Browse & Hire a Lawyer
                            </Button>
                          </Link>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      {caseData.defendant_name
                        ? `Defendant: ${caseData.defendant_name} (not yet registered)`
                        : "Not assigned yet"}
                    </p>
                    {caseData.defendant_email && (
                      <p className="text-xs text-muted">Contact: {caseData.defendant_email}</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "hearings" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  Hearings ({hearings.length})
                </h3>
                <Link href={`/cases/${caseId}/hearings`}>
                  <Button size="sm" variant="outline">
                    <Gavel className="h-4 w-4" />
                    Manage Hearings
                  </Button>
                </Link>
              </div>
              {hearings.length === 0 ? (
                <EmptyState
                  title="No hearings scheduled"
                  description="Hearings will appear here once scheduled."
                  icon={<Calendar className="h-12 w-12" />}
                />
              ) : (
                <div className="space-y-3">
                  {hearings.map((h) => (
                    <Card key={h.id} padding="sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Hearing #{h.hearing_number} — {h.hearing_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted">
                            {formatDate(h.scheduled_date)} • {h.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {isCourtOfficial && h.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRescheduleHearingId(h.id);
                                setRescheduleNewDate("");
                                setRescheduleReason("");
                                setRescheduleError("");
                                setShowRescheduleDialog(true);
                              }}
                            >
                              Adjourn
                            </Button>
                          )}
                          <Link href={`/cases/${caseId}/hearings/${h.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bail" && isCriminalCase && (
            <BailApplicationForm
              caseId={caseData.id}
              isCourtOfficial={!!isCourtOfficial}
              canApply={isLawyer || user?.role === "client"}
            />
          )}

          {activeTab === "investigation" && isCriminalCase && (
            <InvestigationPanel
              caseId={caseData.id}
              investigationStatus={criminalDetails?.investigation_status || "pending"}
              ioName={criminalDetails?.io_name}
              isCourtOfficial={!!isCourtOfficial}
              canSubmitReport={!!isCourtOfficial || isLawyer}
            />
          )}

          {activeTab === "evidence" && showTrialTabs && (
            <EvidencePanel
              caseId={caseData.id}
              isJudge={isTrialJudge || isMagistrate}
              isLawyer={isLawyer}
            />
          )}

          {activeTab === "witnesses" && showTrialTabs && (
            <WitnessPanel
              caseId={caseData.id}
              isJudge={isTrialJudge || isMagistrate}
              isLawyer={isLawyer}
              isStenographer={isStenographer}
            />
          )}

          {activeTab === "judgment" && showTrialTabs && (
            <JudgmentPanel
              caseId={caseData.id}
              isJudge={isTrialJudge || isMagistrate}
              caseStatus={status}
              onRefresh={refreshCase}
            />
          )}

          {activeTab === "decree" && showDecreeTab && (
            <DecreePanel
              caseId={caseData.id}
              caseStatus={status}
              canDraw={!!isCourtOfficial}
              judgmentId={judgment?.id ?? null}
              parties={{
                plaintiff: caseData.plaintiff
                  ? {
                      id: caseData.plaintiff.id,
                      full_name: caseData.plaintiff.full_name,
                    }
                  : null,
                defendant: caseData.defendant
                  ? {
                      id: caseData.defendant.id,
                      full_name: caseData.defendant.full_name,
                    }
                  : null,
              }}
            />
          )}

          {activeTab === "appeals" && showAppealTab && (
            <AppealPanel
              caseId={caseData.id}
              caseStatus={status}
              currentUserId={user?.id ?? null}
              isCourtOfficial={!!isCourtOfficial}
              judgmentDate={judgment?.delivery_date ?? null}
              judgmentId={judgment?.id ?? null}
              decreeId={decree?.id ?? null}
              parties={{
                plaintiff: caseData.plaintiff
                  ? {
                      id: caseData.plaintiff.id,
                      full_name: caseData.plaintiff.full_name,
                    }
                  : null,
                defendant: caseData.defendant
                  ? {
                      id: caseData.defendant.id,
                      full_name: caseData.defendant.full_name,
                    }
                  : null,
              }}
            />
          )}

          {activeTab === "execution" && showExecutionTab && decree && (
            <ExecutionPanel
              caseId={caseData.id}
              currentUserId={user?.id ?? null}
              isCourtOfficial={!!isCourtOfficial}
              decree={{
                id: decree.id,
                status: decree.status,
                decree_holder_id: decree.decree_holder_id,
                judgment_debtor_id: decree.judgment_debtor_id,
                amount_awarded: decree.amount_awarded,
              }}
              parties={{
                plaintiff: caseData.plaintiff
                  ? {
                      id: caseData.plaintiff.id,
                      full_name: caseData.plaintiff.full_name,
                    }
                  : null,
                defendant: caseData.defendant
                  ? {
                      id: caseData.defendant.id,
                      full_name: caseData.defendant.full_name,
                    }
                  : null,
              }}
            />
          )}

          {activeTab === "issues" && showIssuesTab && (
            <IssueFraming
              caseId={caseData.id}
              caseStatus={status}
              canFrame={isAdminCourt ? isAdminCourtActive : !!isCourtOfficial}
              canDecide={!!(isTrialJudge || isMagistrate)}
            />
          )}

          {activeTab === "scrutiny" && (
            <ScrutinyChecklistComponent
              caseId={caseData.id}
              caseTitle={caseData.title}
              isReadOnly={!isCourtOfficial || !["submitted_to_admin", "under_scrutiny"].includes(status)}
              onComplete={refreshCase}
            />
          )}

          {activeTab === "timeline" && (
            <CaseTimeline
              caseId={caseData.id}
              currentStatus={caseData.status}
            />
          )}

          {activeTab === "my_drafts" && (isMagistrate || isTrialJudge) && (
            <JudgeDrafts caseId={caseData.id} />
          )}

          {activeTab === "written_statement" && showWrittenStatementTab && (
            <WrittenStatementPanel
              caseId={caseData.id}
              isDefendantLawyer={isDefendantLawyer}
            />
          )}

          {activeTab === "activity" && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-primary">Activity Log</h3>
              {activityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activityLogs.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Actions taken on this case will appear here."
                  icon={<Clock className="h-12 w-12" />}
                />
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <Card key={log.id} padding="sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {getActionLabel(log.action)}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {log.actor?.full_name ?? "System"} · {formatDate(log.created_at)}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="mt-1 text-xs text-muted/80 truncate">
                              {Object.entries(log.details)
                                .filter(([k]) => !["case_id", "id"].includes(k))
                                .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadModalDefaultDocType(undefined);
        }}
        defaultDocType={uploadModalDefaultDocType}
        onUpload={async (file, docType, title, description) => {
          const result = await uploadDocument(caseId, file, docType, title, description);
          if (!result.error) refreshCase();
          return { error: result.error };
        }}
      />

      {/* AI Document Drafting Modal */}
      <AIDraftingModal
        isOpen={showAIDraftingModal}
        onClose={() => {
          setShowAIDraftingModal(false);
          setAiDraftingDocType(undefined);
        }}
        defaultDocType={aiDraftingDocType}
        caseContext={{
          caseNumber: caseData.case_number,
          caseTitle: caseData.title,
          caseType: caseData.case_type,
          plaintiff: caseData.plaintiff?.full_name,
          defendant: caseData.defendant?.full_name,
        }}
        onUseDraft={async (draftedText, documentType) => {
          try {
            // Convert drafted text to a PDF file
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const lineHeight = 7;
            let y = 20;
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(documentType.replace(/_/g, " ").toUpperCase(), margin, y);
            y += lineHeight * 1.5;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(draftedText, pageWidth - margin * 2) as string[];
            for (const line of lines) {
              if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
              doc.text(line, margin, y);
              y += lineHeight;
            }
            const pdfBlob = doc.output("blob");
            const fileName = `${documentType}_draft_${Date.now()}.pdf`;
            const file = new File([pdfBlob], fileName, { type: "application/pdf" });

            // Upload the document
            const result = await uploadDocument(
              caseId,
              file,
              documentType,
              `AI Drafted ${documentType.replace(/_/g, " ")}`,
              "Generated by AI Document Drafting"
            );

            if (!result.error) {
              // Refresh case data to show new document
              refreshCase();
              // Modal will close automatically
            } else {
              alert(`Failed to upload: ${result.error}`);
            }
          } catch (err) {
            console.error("Failed to upload draft:", err);
            alert("Failed to upload the drafted document. Please try downloading it instead.");
          }
        }}
      />

      {/* Document Request Dialog */}
      {showDocRequestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-primary">Request Document from Client</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Document Type</label>
                <select
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={docRequestForm.document_type}
                  title="Document Req Form"
                  onChange={(e) => setDocRequestForm((f) => ({ ...f, document_type: e.target.value }))}
                >
                  <option value="written_statement">Written Statement</option>
                  <option value="affidavit">Affidavit</option>
                  <option value="evidence">Evidence</option>
                  <option value="power_of_attorney">Power of Attorney</option>
                  <option value="vakalatnama">Vakalatnama</option>
                  <option value="application">Application</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Document Title</label>
                <input
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="e.g., Written Statement in response to Plaint"
                  value={docRequestForm.title}
                  onChange={(e) => setDocRequestForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Instructions (Optional)</label>
                <textarea
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Any specific requirements or instructions..."
                  value={docRequestForm.description}
                  onChange={(e) => setDocRequestForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            {docRequestError && (
              <div className="mt-3 rounded-lg border border-danger bg-danger-light p-2 text-sm text-danger">
                {docRequestError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDocRequestDialog(false);
                  setDocRequestError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={docRequestLoading}
                disabled={!docRequestForm.title || !docRequestForm.requested_from}
                onClick={async () => {
                  setDocRequestLoading(true);
                  setDocRequestError("");
                  const result = await createDocRequest({
                    requested_from: docRequestForm.requested_from,
                    document_type: docRequestForm.document_type,
                    title: docRequestForm.title,
                    description: docRequestForm.description || undefined,
                  });
                  setDocRequestLoading(false);
                  if (result.error) {
                    setDocRequestError(result.error);
                  } else {
                    setShowDocRequestDialog(false);
                    setDocRequestForm({ requested_from: "", document_type: "written_statement", title: "", description: "" });
                  }
                }}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw / Remove Case Dialog */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Withdraw Case?</h3>
            <p className="text-sm text-muted">
              This will withdraw &ldquo;{caseData.title}&rdquo; from proceedings. The case will be
              marked as <strong>Withdrawn</strong> and no further actions can be taken on it.
            </p>
            {withdrawError && (
              <div className="mt-3 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                {withdrawError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowWithdrawDialog(false); setWithdrawError(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isWithdrawing}
                onClick={async () => {
                  setIsWithdrawing(true);
                  setWithdrawError("");
                  const result = await withdrawCase(caseId);
                  setIsWithdrawing(false);
                  if (result.error) {
                    setWithdrawError(result.error);
                  } else {
                    router.push("/cases");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Yes, Withdraw
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule / Adjourn Hearing Dialog */}
      {showRescheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-primary">Adjourn / Reschedule Hearing</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">New Hearing Date</label>
                <input
                  type="date"
                  title="New hearing date"
                  placeholder="Select date"
                  className="w-full rounded-lg border border-border bg-cream-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={rescheduleNewDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setRescheduleNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reason for Adjournment</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-cream-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  placeholder="State the reason for adjourning this hearing..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
              {rescheduleError && (
                <div className="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                  {rescheduleError}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRescheduleDialog(false)}
              >
                Cancel
              </Button>
              <Button
                isLoading={rescheduleLoading}
                onClick={async () => {
                  if (!rescheduleNewDate) { setRescheduleError("Please select a new hearing date."); return; }
                  if (!rescheduleReason.trim()) { setRescheduleError("Please provide a reason for adjournment."); return; }
                  setRescheduleLoading(true);
                  setRescheduleError("");
                  const result = await rescheduleHearing(rescheduleHearingId, rescheduleNewDate, rescheduleReason.trim());
                  setRescheduleLoading(false);
                  if (result?.error) {
                    setRescheduleError(result.error);
                  } else {
                    setShowRescheduleDialog(false);
                  }
                }}
              >
                Confirm Adjournment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Judge Dialog */}
      {showAssignJudgeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-primary">Assign Judge</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Judge</label>
                <select
                  className="w-full rounded-lg border border-border bg-cream-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedJudgeId}
                  title="Select Judge"
                  onChange={(e) => setSelectedJudgeId(e.target.value)}
                >
                  <option value="">— Select a judge —</option>
                  {judgeList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.full_name} ({j.email})
                    </option>
                  ))}
                </select>
                {judgeList.length === 0 && (
                  <p className="mt-1 text-xs text-muted">No magistrates or trial judges found.</p>
                )}
              </div>
              {caseData.trial_judge_id && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This case already has a judge assigned. Selecting a new judge will replace the current assignment.
                </p>
              )}
            </div>
            {assignJudgeError && (
              <div className="mt-3 rounded-lg border border-danger bg-danger-light p-2 text-sm text-danger">
                {assignJudgeError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignJudgeDialog(false);
                  setAssignJudgeError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={assignJudgeLoading}
                disabled={!selectedJudgeId}
                onClick={async () => {
                  setAssignJudgeLoading(true);
                  setAssignJudgeError("");
                  const result = await assignJudge(selectedJudgeId);
                  setAssignJudgeLoading(false);
                  if (result.error) {
                    setAssignJudgeError(result.error);
                  } else {
                    setShowAssignJudgeDialog(false);
                    await refreshCase();
                  }
                }}
              >
                Assign Judge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Stenographer Dialog */}
      {showAssignStenoDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-primary">Assign Stenographer</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Stenographer</label>
                <select
                  className="w-full rounded-lg border border-border bg-cream-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedStenoId}
                  title="Select Stenographer"
                  onChange={(e) => setSelectedStenoId(e.target.value)}
                >
                  <option value="">— Select a stenographer —</option>
                  {stenoList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
                {stenoList.length === 0 && (
                  <p className="mt-1 text-xs text-muted">No stenographers found.</p>
                )}
              </div>
              {caseData.stenographer_id && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This case already has a stenographer assigned. Selecting a new one will replace the current assignment.
                </p>
              )}
            </div>
            {assignStenoError && (
              <div className="mt-3 rounded-lg border border-danger bg-danger-light p-2 text-sm text-danger">
                {assignStenoError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignStenoDialog(false);
                  setAssignStenoError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={assignStenoLoading}
                disabled={!selectedStenoId}
                onClick={async () => {
                  setAssignStenoLoading(true);
                  setAssignStenoError("");
                  const result = await assignStenographer(selectedStenoId);
                  setAssignStenoLoading(false);
                  if (result.error) {
                    setAssignStenoError(result.error);
                  } else {
                    setShowAssignStenoDialog(false);
                    await refreshCase();
                  }
                }}
              >
                Assign Stenographer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summon Confirmation Dialog */}
      {showSummonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-xl">
            {summonResult ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-primary">
                  Summon Issued Successfully
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="font-medium text-green-800">
                      Summon sent to {summonResult.defendant_name}
                    </p>
                    <ul className="mt-2 space-y-1 text-green-700">
                      {summonResult.defendant_email && (
                        <li>Email: {summonResult.email_sent ? "Sent" : "Logged (demo mode)"} to {summonResult.defendant_email}</li>
                      )}
                      <li>In-app notification: {summonResult.notification_sent ? "Sent" : "Pending registration"}</li>
                      <li>Registration link: {summonResult.register_url}</li>
                    </ul>
                  </div>
                  {!summonResult.notification_sent && (
                    <p className="text-muted">
                      The defendant has not registered on the platform yet. They will receive the in-app notification once they create an account and are linked to this case.
                    </p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowSummonDialog(false);
                      setSummonResult(null);
                      refreshCase();
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-4 text-lg font-semibold text-primary">
                  Issue Court Summon
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-muted">
                    You are about to issue an official court summon for the following case:
                  </p>
                  <div className="rounded-lg border border-border bg-cream-light p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Case:</span>
                      <span className="font-medium">{caseData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Case Number:</span>
                      <span className="font-medium">{caseData.case_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Defendant:</span>
                      <span className="font-medium">{caseData.defendant_name || "Not specified"}</span>
                    </div>
                    {caseData.defendant_email && (
                      <div className="flex justify-between">
                        <span className="text-muted">Defendant Email:</span>
                        <span className="font-medium">{caseData.defendant_email}</span>
                      </div>
                    )}
                    {caseData.defendant_phone && (
                      <div className="flex justify-between">
                        <span className="text-muted">Defendant Phone:</span>
                        <span className="font-medium">{caseData.defendant_phone}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted">
                    The defendant will be notified via {caseData.defendant_email ? "email and " : ""}in-app notification with instructions to register, hire a lawyer, and submit their response within 30 days.
                  </p>
                </div>
                {actionError && (
                  <div className="mt-3 rounded-lg border border-danger bg-danger-light p-2 text-sm text-danger">
                    {actionError}
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSummonDialog(false);
                      setActionError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isActionLoading}
                    onClick={async () => {
                      setIsActionLoading(true);
                      setActionError("");
                      const result = await issueSummon(caseId);
                      setIsActionLoading(false);
                      if (result.error) {
                        setActionError(result.error);
                      } else {
                        setSummonResult(result.data?.summon || null);
                      }
                    }}
                  >
                    <Gavel className="h-4 w-4" />
                    Confirm &amp; Issue Summon
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
