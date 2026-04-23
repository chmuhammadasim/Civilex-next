"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { HearingAttendance, AttendanceRole, AttendanceSide } from "@/types/trial";

interface AddAttendeeInput {
  person_name: string;
  person_role: AttendanceRole;
  side?: AttendanceSide;
  is_present?: boolean;
  notes?: string;
}

export function useHearingAttendance(hearingId: string, caseId: string) {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<HearingAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!hearingId || !caseId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hearing_attendance")
        .select("*")
        .eq("hearing_id", hearingId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching attendance:", error);
        setAttendance([]);
      } else {
        setAttendance((data as HearingAttendance[]) ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hearingId, caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /** Add a single attendee to this hearing */
  const addAttendee = async (
    input: AddAttendeeInput
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    if (!input.person_name.trim()) return { error: "Name is required" };

    try {
      const supabase = createClient();
      const { error } = await supabase.from("hearing_attendance").insert({
        hearing_id: hearingId,
        case_id: caseId,
        person_name: input.person_name.trim(),
        person_role: input.person_role,
        side: input.side ?? null,
        is_present: input.is_present ?? true,
        notes: input.notes?.trim() || null,
        recorded_by: user.id,
      });

      if (error) return { error: error.message };
      await fetch();
      return { error: null };
    } catch {
      return { error: "Failed to record attendee" };
    }
  };

  /** Toggle present/absent for an existing entry */
  const togglePresence = async (
    attendanceId: string,
    isPresent: boolean
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("hearing_attendance")
        .update({ is_present: isPresent })
        .eq("id", attendanceId);

      if (error) return { error: error.message };
      await fetch();
      return { error: null };
    } catch {
      return { error: "Failed to update attendance" };
    }
  };

  /** Remove an attendee entry */
  const removeAttendee = async (
    attendanceId: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("hearing_attendance")
        .delete()
        .eq("id", attendanceId);

      if (error) return { error: error.message };
      await fetch();
      return { error: null };
    } catch {
      return { error: "Failed to remove attendee" };
    }
  };

  /**
   * Pre-populate the attendance sheet from case parties for a hearing.
   * Skips if entries already exist.
   */
  const autoPopulate = async (caseData: {
    plaintiff_name: string | null;
    defendant_name: string | null;
    trial_judge_id: string | null;
    stenographer_id: string | null;
    assignments?: { side: string; status: string; lawyer?: { full_name: string } | null }[];
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    if (attendance.length > 0) return { error: null }; // already populated

    const entries: AddAttendeeInput[] = [];

    if (caseData.plaintiff_name) {
      entries.push({ person_name: caseData.plaintiff_name, person_role: "plaintiff", side: "plaintiff" });
    }
    if (caseData.defendant_name) {
      entries.push({ person_name: caseData.defendant_name, person_role: "defendant", side: "defendant" });
    }

    const accepted = (caseData.assignments ?? []).filter((a) => a.status === "accepted");
    for (const a of accepted) {
      const lawyerName = a.lawyer?.full_name ?? "Lawyer";
      entries.push({
        person_name: lawyerName,
        person_role: a.side === "plaintiff" ? "plaintiff_lawyer" : "defendant_lawyer",
        side: a.side as AttendanceSide,
      });
    }

    const errors: string[] = [];
    for (const entry of entries) {
      const result = await addAttendee(entry);
      if (result.error) errors.push(result.error);
    }

    return { error: errors.length > 0 ? errors.join("; ") : null };
  };

  return { attendance, isLoading, addAttendee, togglePresence, removeAttendee, autoPopulate, refetch: fetch };
}
