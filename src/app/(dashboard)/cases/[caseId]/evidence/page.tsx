"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import EvidencePanel from "@/components/features/trial/EvidencePanel";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { useCase } from "@/hooks/useCases";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function CaseEvidencePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { caseData, isLoading } = useCase(caseId);

  if (isLoading) {
    return (
      <div>
        <Topbar title="Evidence" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData || !user) return null;

  const isJudge = user.role === "trial_judge";
  const isLawyer = user.role === "lawyer";

  return (
    <div>
      <Topbar title={`Evidence — ${caseData.case_number}`} />
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

        <EvidencePanel
          caseId={caseId}
          isJudge={isJudge}
          isLawyer={isLawyer}
        />
      </div>
    </div>
  );
}
