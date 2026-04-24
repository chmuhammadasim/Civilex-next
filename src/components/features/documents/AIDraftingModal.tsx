"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useAIDrafting, type CaseContext } from "@/hooks/useAIDrafting";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { Sparkles, Copy, Download, FileText, Loader2, CheckCircle2 } from "lucide-react";

const DOC_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS)
  .filter(([key]) =>
    ["evidence", "written_statement", "affidavit", "power_of_attorney", "vakalatnama", "application", "other"].includes(
      key
    )
  )
  .map(([value, label]) => ({ value, label }));

interface AIDraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: Pre-fill document type */
  defaultDocType?: string;
  /** Optional: Case context to help AI generate better drafts */
  caseContext?: CaseContext;
  /** Called when user wants to use the drafted document */
  onUseDraft?: (draftedText: string, documentType: string) => void;
}

export default function AIDraftingModal({
  isOpen,
  onClose,
  defaultDocType,
  caseContext,
  onUseDraft,
}: AIDraftingModalProps) {
  const { draftDocument, isLoading } = useAIDrafting();

  const [documentType, setDocumentType] = useState(defaultDocType ?? "other");
  const [prompt, setPrompt] = useState("");
  const [draftedDocument, setDraftedDocument] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultDocType) setDocumentType(defaultDocType);
  }, [defaultDocType]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe what you want in the document");
      return;
    }

    setError(null);
    setDraftedDocument(null);

    const result = await draftDocument({
      prompt: prompt.trim(),
      documentType,
      caseContext,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setDraftedDocument(result.document);
    }
  };

  const handleCopy = async () => {
    if (!draftedDocument) return;
    try {
      await navigator.clipboard.writeText(draftedDocument);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownload = () => {
    if (!draftedDocument) return;
    const blob = new Blob([draftedDocument], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentType}_draft_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUseDraft = () => {
    if (draftedDocument && onUseDraft) {
      onUseDraft(draftedDocument, documentType);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt("");
    setDraftedDocument(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="✨ AI Document Drafting"
      size="xl"
    >
      <div className="space-y-4">
        {/* Step 1: Choose document type and describe */}
        {!draftedDocument && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Document Type
              </label>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                options={DOC_TYPE_OPTIONS}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Describe Your Document
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Draft a written statement denying allegations in a property dispute case' or 'Create an affidavit for identity verification with CNIC details'"
                rows={6}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-muted">
                The AI will generate a properly formatted legal document based on your description.
                {caseContext?.caseNumber && " Case details will be automatically included."}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!prompt.trim()}
              >
                <Sparkles className="h-4 w-4" />
                Generate Draft
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Show generated document */}
        {draftedDocument && (
          <>
            <div className="rounded-lg border border-success bg-success/5 px-3 py-2 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Document drafted successfully! Review and edit as needed.
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Generated Document
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    title="Download as text file"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={draftedDocument}
                onChange={(e) => setDraftedDocument(e.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
              <p className="mt-1 text-xs text-muted">
                You can edit the document above before using it. Remember to replace placeholders like
                [Name], [Date], [CNIC] with actual values.
              </p>
            </div>

            <div className="flex justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDraftedDocument(null);
                  setError(null);
                }}
              >
                Generate Another
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                {onUseDraft && (
                  <Button variant="primary" onClick={handleUseDraft}>
                    <FileText className="h-4 w-4" />
                    Use This Draft
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
