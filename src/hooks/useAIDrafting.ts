"use client";

import { useState } from "react";

export interface CaseContext {
  caseNumber?: string;
  caseTitle?: string;
  caseType?: string;
  plaintiff?: string;
  defendant?: string;
}

export interface DraftDocumentParams {
  prompt: string;
  documentType: string;
  caseContext?: CaseContext;
}

export interface DraftDocumentResult {
  document: string | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * useAIDrafting
 *
 * Hook for AI-powered legal document drafting using OpenAI.
 * Supports evidence, written statements, affidavits, power of attorney,
 * vakalatnama, applications, and other legal documents.
 */
export function useAIDrafting() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftDocument = async ({
    prompt,
    documentType,
    caseContext,
  }: DraftDocumentParams): Promise<{ document: string | null; error: string | null }> => {
    if (!prompt.trim()) {
      return { document: null, error: "Please provide a description for the document" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/draft-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          documentType,
          caseContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to draft document");
        return { document: null, error: data.error || "Failed to draft document" };
      }

      setIsLoading(false);
      return { document: data.document, error: null };
    } catch (err) {
      const errorMsg = "Network error. Please check your connection and try again.";
      setError(errorMsg);
      setIsLoading(false);
      return { document: null, error: errorMsg };
    }
  };

  return {
    draftDocument,
    isLoading,
    error,
  };
}
