"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import BailApplicationForm from "@/components/features/criminal/BailApplicationForm";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useCase } from "@/hooks/useCases";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, FileQuestion, Scale } from "lucide-react";

export default function CaseApplicationsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { caseData, isLoading: caseLoading } = useCase(caseId);
  const { requests, isLoading: reqLoading, fulfillRequest } = useDocumentRequests(caseId);
  const [activeSection, setActiveSection] = useState<"documents" | "bail">("documents");

  const isLoading = caseLoading || reqLoading;
  const isCriminal = caseData?.case_type === "criminal";
  const isCourtOfficial =
    user?.role === "admin_court" ||
    user?.role === "magistrate" ||
    user?.role === "trial_judge";
  const canApplyBail = user?.role === "client" || user?.role === "lawyer";

  if (isLoading) {
    return (
      <div>
        <Topbar title="Applications" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData || !user) return null;

  const statusVariant: Record<string, "default" | "success" | "danger" | "warning"> = {
    pending: "warning",
    fulfilled: "success",
    cancelled: "default",
  };

  return (
    <div>
      <Topbar title={`Applications — ${caseData.case_number}`} />
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/cases/${caseId}`)}
          className="flex items-center gap-1 text-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Button>

        {/* Section Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveSection("documents")}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              activeSection === "documents"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <FileQuestion className="inline h-4 w-4 mr-1" />
            Document Requests
          </button>
          {isCriminal && (
            <button
              onClick={() => setActiveSection("bail")}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
                activeSection === "bail"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Scale className="inline h-4 w-4 mr-1" />
              Bail Applications
            </button>
          )}
        </div>

        {/* Document Requests Section */}
        {activeSection === "documents" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <EmptyState
                icon={<FileQuestion className="h-12 w-12" />}
                title="No Document Requests"
                description="Document requests submitted by parties will appear here."
              />
            ) : (
              requests.map((req) => (
                <Card key={req.id} padding="md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{req.title}</p>
                      {req.description && (
                        <p className="text-sm text-muted">{req.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-muted">
                        <span>From: {req.requester?.full_name ?? "—"}</span>
                        <span>To: {req.recipient?.full_name ?? "—"}</span>
                        <span>{formatDate(req.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[req.status] ?? "default"}>
                        {req.status}
                      </Badge>
                      {req.status === "pending" && isCourtOfficial && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fulfillRequest(req.id)}
                        >
                          Mark Fulfilled
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Bail Applications Section */}
        {activeSection === "bail" && isCriminal && (
          <BailApplicationForm
            caseId={caseId}
            isCourtOfficial={isCourtOfficial}
            canApply={canApplyBail}
          />
        )}
      </div>
    </div>
  );
}
