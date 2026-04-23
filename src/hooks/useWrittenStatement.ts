"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type {
  WrittenStatement,
  WrittenStatementWithRelations,
  WrittenStatementStatus,
  SpecificResponse,
} from "@/types/trial";

interface SaveWrittenStatementInput {
  general_denial?: string;
  specific_responses?: SpecificResponse[];
  preliminary_objections?: string;
  counter_arguments?: string;
  relief_sought?: string;
  witness_names?: string[];
}

export function useWrittenStatement(caseId: string) {
  const { user } = useAuth();
  const [statement, setStatement] =
    useState<WrittenStatementWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("written_statements")
        .select(`*, filer:profiles!filed_by(id, full_name)`)
        .eq("case_id", caseId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching written statement:", error);
        setStatement(null);
      } else {
        setStatement(data as WrittenStatementWithRelations | null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /** Create a new draft written statement for the case */
  const createDraft = async (
    input: SaveWrittenStatementInput
  ): Promise<{ error: string | null; data: WrittenStatement | null }> => {
    if (!user) return { error: "Not authenticated", data: null };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("written_statements")
        .insert({
          case_id: caseId,
          filed_by: user.id,
          status: "draft",
          general_denial: input.general_denial?.trim() || null,
          specific_responses: input.specific_responses ?? [],
          preliminary_objections: input.preliminary_objections?.trim() || null,
          counter_arguments: input.counter_arguments?.trim() || null,
          relief_sought: input.relief_sought?.trim() || null,
          witness_names: input.witness_names ?? [],
        })
        .select()
        .single();

      if (error) return { error: error.message, data: null };

      await supabase.from("case_activity_log").insert({
        case_id: caseId,
        actor_id: user.id,
        action: "written_statement_drafted",
        details: {},
      });

      await fetch();
      return { error: null, data: data as WrittenStatement };
    } catch {
      return { error: "Failed to save written statement", data: null };
    }
  };

  /** Update an existing draft (only while status = 'draft') */
  const updateDraft = async (
    statementId: string,
    input: SaveWrittenStatementInput
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("written_statements")
        .update({
          general_denial: input.general_denial?.trim() || null,
          specific_responses: input.specific_responses ?? [],
          preliminary_objections: input.preliminary_objections?.trim() || null,
          counter_arguments: input.counter_arguments?.trim() || null,
          relief_sought: input.relief_sought?.trim() || null,
          witness_names: input.witness_names ?? [],
        })
        .eq("id", statementId)
        .eq("status", "draft");

      if (error) return { error: error.message };

      await fetch();
      return { error: null };
    } catch {
      return { error: "Failed to update written statement" };
    }
  };

  /**
   * Officially file the written statement.
   * Sets status → 'filed', stamps filed_at, and records the activity.
   */
  const fileStatement = async (
    statementId: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("written_statements")
        .update({
          status: "filed" as WrittenStatementStatus,
          filed_at: new Date().toISOString(),
        })
        .eq("id", statementId)
        .eq("status", "draft");

      if (error) return { error: error.message };

      // Notify court officials and plaintiff-side parties
      const { data: caseRow } = await supabase
        .from("cases")
        .select("title, case_number, plaintiff_id, admin_court_id")
        .eq("id", caseId)
        .single();

      const recipientIds: string[] = [];
      if (caseRow?.plaintiff_id) recipientIds.push(caseRow.plaintiff_id);
      if (caseRow?.admin_court_id) recipientIds.push(caseRow.admin_court_id);

      // Include plaintiff's lawyer
      const { data: assignments } = await supabase
        .from("case_assignments")
        .select("lawyer_id")
        .eq("case_id", caseId)
        .eq("side", "plaintiff")
        .eq("status", "accepted");
      if (assignments) {
        for (const a of assignments) recipientIds.push(a.lawyer_id);
      }

      for (const uid of recipientIds) {
        if (uid === user.id) continue;
        await supabase.from("notifications").insert({
          user_id: uid,
          title: "Written Statement Filed",
          message: `The defendant's lawyer has filed the written statement for case "${caseRow?.title}" (${caseRow?.case_number}).`,
          type: "case_status_changed",
          reference_type: "case",
          reference_id: caseId,
        });
      }

      await supabase.from("case_activity_log").insert({
        case_id: caseId,
        actor_id: user.id,
        action: "written_statement_filed",
        details: { statement_id: statementId },
      });

      await fetch();
      return { error: null };
    } catch {
      return { error: "Failed to file written statement" };
    }
  };

  return { statement, isLoading, createDraft, updateDraft, fileStatement, refetch: fetch };
}
