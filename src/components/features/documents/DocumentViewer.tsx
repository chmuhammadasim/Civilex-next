"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import OtpSignatureModal from "@/components/features/signatures/OtpSignatureModal";
import type { CaseDocument } from "@/types/case";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  Download,
  PenTool,
  ShieldCheck,
  User,
  File,
  FileText,
  FileImage,
  AlertTriangle,
} from "lucide-react";

/* ── Props ─────────────────────────────────────────────────────────── */
interface DocumentViewerProps {
  document: CaseDocument;
  isOpen: boolean;
  onClose: () => void;
  /** Async function that returns a short-lived signed URL for the file. */
  getUrl: (filePath: string) => Promise<string | null>;
  /** Whether the current user may sign this document. */
  canSign?: boolean;
  /** Called after OTP signing is confirmed. */
  onSigned?: () => void;
}

/* ── Helpers ───────────────────────────────────────────────────────── */
function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType === "application/pdf")
    return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType?.startsWith("image/"))
    return <FileImage className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-muted" />;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function DocumentViewer({
  document,
  isOpen,
  onClose,
  getUrl,
  canSign = false,
  onSigned,
}: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [signing, setSigning] = useState(false);

  /* Fetch signed URL whenever the modal opens or the document changes */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    setUrl(null);
    setUrlError(false);
    setUrlLoading(true);

    getUrl(document.file_path).then((result) => {
      if (cancelled) return;
      setUrl(result);
      if (!result) setUrlError(true);
      setUrlLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, document.file_path, getUrl]);

  const handleDownload = () => {
    if (!url) return;
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.file_name;
    a.click();
  };

  const docTypeLabel =
    DOCUMENT_TYPE_LABELS[document.document_type] ??
    document.document_type.replace(/_/g, " ");

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={document.title}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          {/* ── Metadata bar ─────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-cream px-3 py-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <FileTypeIcon mimeType={document.mime_type} />
              <span className="font-medium text-foreground/80">
                {docTypeLabel}
              </span>
            </span>

            {document.file_size ? (
              <span>{formatSize(document.file_size)}</span>
            ) : null}

            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {document.uploader?.full_name ?? "Unknown"}
            </span>

            <span>{formatDate(document.created_at)}</span>

            {document.is_signed ? (
              <Badge variant="success">
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                Digitally Signed
              </Badge>
            ) : (
              <Badge variant="warning">Unsigned</Badge>
            )}
          </div>

          {/* ── Description ──────────────────────────────────────── */}
          {document.description && (
            <p className="text-sm text-muted">{document.description}</p>
          )}

          {/* ── Preview area ─────────────────────────────────────── */}
          <div className="min-h-64 overflow-hidden rounded-xl border border-border bg-surface">
            {urlLoading && (
              <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
              </div>
            )}

            {!urlLoading && urlError && (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted">
                <AlertTriangle className="h-8 w-8 text-warning" />
                <p className="text-sm">Could not load file preview.</p>
              </div>
            )}

            {!urlLoading && url && (
              <>
                {document.mime_type === "application/pdf" ? (
                  <iframe
                    src={url}
                    className="h-[65vh] w-full"
                    title={document.title}
                  />
                ) : document.mime_type?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={document.title}
                    className="max-h-[65vh] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted">
                    <File className="h-12 w-12" />
                    <p className="text-sm">
                      Preview not available for this file type.
                    </p>
                    <Button size="sm" onClick={handleDownload} disabled={!url}>
                      <Download className="h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Actions ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {canSign && !document.is_signed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSigning(true)}
                >
                  <PenTool className="h-4 w-4" />
                  Sign Document
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!url}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── OTP Signature flow ─────────────────────────────────────── */}
      {signing && (
        <OtpSignatureModal
          isOpen
          onClose={() => setSigning(false)}
          entityType="document"
          entityId={document.id}
          entityLabel={`${docTypeLabel}: ${document.title}`}
          onSigned={() => {
            setSigning(false);
            onSigned?.();
          }}
        />
      )}
    </>
  );
}
