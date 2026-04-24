"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { CaseDocument } from "@/types/case";
import { Save } from "lucide-react";

const DOC_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

interface EditDocumentModalProps {
  document: CaseDocument;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    documentId: string,
    updates: { title: string; description: string; document_type: string }
  ) => Promise<{ error: string | null }>;
}

export default function EditDocumentModal({
  document,
  isOpen,
  onClose,
  onSave,
}: EditDocumentModalProps) {
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description ?? "");
  const [docType, setDocType] = useState<string>(document.document_type);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Sync if document prop changes (e.g. parent re-renders) */
  useEffect(() => {
    setTitle(document.title);
    setDescription(document.description ?? "");
    setDocType(document.document_type);
    setError(null);
  }, [document.id, document.title, document.description, document.document_type]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setIsSaving(true);
    const { error: saveError } = await onSave(document.id, {
      title: title.trim(),
      description: description.trim(),
      document_type: docType,
    });
    setIsSaving(false);

    if (saveError) {
      setError(saveError);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current file info (read-only) */}
        <div className="rounded-lg border border-border bg-cream-light px-3 py-2">
          <p className="text-xs text-muted">File</p>
          <p className="truncate text-sm font-medium text-foreground">
            {document.file_name}
          </p>
        </div>

        {/* Document type */}
        <Select
          id="edit-docType"
          label="Document Type"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          options={DOC_TYPE_OPTIONS}
        />

        {/* Title */}
        <Input
          id="edit-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Plaintiff Written Statement"
        />

        {/* Description */}
        <Textarea
          id="edit-description"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of this document…"
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
