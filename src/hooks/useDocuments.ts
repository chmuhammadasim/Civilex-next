"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { CaseDocument } from "@/types/case";

/**
 * useDocuments
 *
 * Focused hook for document operations on a single case.
 * Use this instead of `useCases()` when you only need document data —
 * it avoids fetching the full case list.
 */
export function useDocuments(caseId: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!user || !caseId) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documents")
        .select("*, uploader:profiles!uploaded_by(id, full_name, email)")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("useDocuments fetch error:", error);
      } else {
        setDocuments((data as CaseDocument[]) ?? []);
      }
    } catch (err) {
      console.error("useDocuments unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, caseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /* ── Upload ─────────────────────────────────────────────────────── */
  const uploadDocument = async (
    file: File,
    documentType: string,
    title: string,
    description?: string
  ): Promise<{ error: string | null; data: CaseDocument | null }> => {
    if (!user) return { error: "Not authenticated", data: null };

    try {
      const supabase = createClient();
      const safeName = file.name.replace(/\s+/g, "_");
      const filePath = `${caseId}/${documentType}/${crypto.randomUUID()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(filePath, file);

      if (uploadError) return { error: uploadError.message, data: null };

      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          case_id: caseId,
          uploaded_by: user.id,
          document_type: documentType,
          title,
          description: description?.trim() || null,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select("*, uploader:profiles!uploaded_by(id, full_name, email)")
        .single();

      if (docError) return { error: docError.message, data: null };

      // Prepend new doc to local state (no refetch needed)
      setDocuments((prev) => [doc as CaseDocument, ...prev]);
      return { error: null, data: doc as CaseDocument };
    } catch (err) {
      console.error("useDocuments uploadDocument error:", err);
      return { error: "Failed to upload document", data: null };
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────── */
  const deleteDocument = async (
    documentId: string,
    filePath: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      // Best-effort storage delete
      await supabase.storage.from("case-documents").remove([filePath]);

      const isAdmin = user.role === "admin_court";
      let query = supabase.from("documents").delete().eq("id", documentId);
      if (!isAdmin) query = query.eq("uploaded_by", user.id);

      const { error } = await query;
      if (error) return { error: error.message };

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      return { error: null };
    } catch (err) {
      console.error("useDocuments deleteDocument error:", err);
      return { error: "Failed to delete document" };
    }
  };

  /* ── Signed URL ─────────────────────────────────────────────────── */
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(filePath, 60 * 5); // 5-minute expiry
      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  };

  /* ── Update metadata ────────────────────────────────────────────── */
  const updateDocument = async (
    documentId: string,
    updates: { title?: string; description?: string; document_type?: string }
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      const isAdmin = user.role === "admin_court";
      let query = supabase
        .from("documents")
        .update(updates)
        .eq("id", documentId);
      if (!isAdmin) query = query.eq("uploaded_by", user.id);

      const { error } = await query;
      if (error) return { error: error.message };

      // Patch local state so UI updates without a full refetch
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId ? ({ ...d, ...updates } as CaseDocument) : d
        )
      );
      return { error: null };
    } catch (err) {
      console.error("useDocuments updateDocument error:", err);
      return { error: "Failed to update document" };
    }
  };

  return {
    documents,
    isLoading,
    refresh: fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
  };
}
