"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import DocumentList from "@/components/features/documents/DocumentList";
import UploadDocumentModal from "@/components/features/documents/UploadDocumentModal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { useCase } from "@/hooks/useCases";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function CaseDocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  // useCase for case metadata (number, assignments); useDocuments for doc CRUD
  const { caseData, isLoading: caseLoading } = useCase(caseId);
  const {
    documents,
    isLoading: docsLoading,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
    refresh,
  } = useDocuments(caseId);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isLoading = caseLoading || docsLoading;

  if (isLoading) {
    return (
      <div>
        <Topbar title="Case Documents" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData || !user) return null;

  const role = user.role as
    | "client"
    | "lawyer"
    | "magistrate"
    | "trial_judge"
    | "admin_court"
    | "stenographer";

  const isAssignedLawyer =
    role === "lawyer" &&
    caseData.assignments?.some(
      (a) => a.lawyer_id === user.id && a.status === "accepted"
    );

  return (
    <div>
      <Topbar title={`Documents — ${caseData.case_number}`} />
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

        <DocumentList
          documents={documents}
          permissions={{ role, currentUserId: user.id, isAssignedLawyer }}
          onUploadClick={() => setShowUploadModal(true)}
          onDelete={deleteDocument}
          onEdit={updateDocument}
          onGetUrl={getDocumentUrl}
          onRefresh={refresh}
        />
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={async (file, docType, title) => {
            const result = await uploadDocument(file, docType, title);
            return { error: result.error };
          }}
        />
      )}
    </div>
  );
}
