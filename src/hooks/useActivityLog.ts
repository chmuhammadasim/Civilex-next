"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivityLogEntry {
  id: string;
  case_id: string;
  actor_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  actor?: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

const ACTION_LABELS: Record<string, string> = {
  case_created: "Case Created",
  lawyer_accepted: "Lawyer Accepted Case",
  lawyer_declined: "Lawyer Declined Case",
  payment_received: "Payment Received",
  submitted_to_admin: "Case Submitted to Admin",
  drafting_started: "Drafting Started",
  case_registered: "Case Registered",
  summon_issued: "Summon Issued",
  judge_assigned: "Judge Assigned",
  stenographer_assigned: "Stenographer Assigned",
  hearing_scheduled: "Hearing Scheduled",
  hearing_rescheduled: "Hearing Rescheduled / Adjourned",
  order_issued: "Order Issued",
  proceedings_recorded: "Proceedings Recorded",
  judgment_delivered: "Judgment Delivered",
  case_transferred: "Case Transferred to Trial",
  case_returned: "Case Returned for Revision",
  case_scrutinized: "Case Scrutinized",
  challan_submitted: "Challan Submitted",
  bail_decided: "Bail Decision Made",
  evidence_added: "Evidence Added",
  status_changed: "Status Updated",
  case_withdrawn: "Case Withdrawn",
  case_disposed: "Case Disposed",
  criminal_details_updated: "Criminal Details Updated",
  defendant_lawyer_requested: "Defendant Requested Lawyer",
};

export function getActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ||
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function useActivityLog(caseId: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !caseId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("case_activity_log")
        .select(
          `id, case_id, actor_id, action, details, created_at,
           actor:profiles!actor_id(full_name, email, role)`
        )
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching activity log:", error);
      } else {
        setLogs((data as unknown as ActivityLogEntry[]) || []);
      }
    } catch (err) {
      console.error("Error fetching activity log:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, caseId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, refetch: fetchLogs };
}
