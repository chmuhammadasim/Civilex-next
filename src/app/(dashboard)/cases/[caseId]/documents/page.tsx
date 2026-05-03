"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import DocumentList from "@/components/features/documents/DocumentList";
import UploadDocumentModal from "@/components/features/documents/UploadDocumentModal";
import AIDraftingModal from "@/components/features/documents/AIDraftingModal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { useCase } from "@/hooks/useCases";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Sparkles } from "lucide-react";

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
  const [showAIDraftingModal, setShowAIDraftingModal] = useState(false);

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

        <div className="flex justify-end gap-3 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAIDraftingModal(true)}
            className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/30"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Draft Document
          </Button>
        </div>

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

      <AIDraftingModal
        isOpen={showAIDraftingModal}
        onClose={() => setShowAIDraftingModal(false)}
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
              file,
              documentType,
              `AI Drafted ${documentType.replace(/_/g, " ")}`,
              "Generated by AI Document Drafting"
            );

            if (!result.error) {
              // Refresh documents list
              refresh();
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
    </div>
  );
}
