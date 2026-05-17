"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { LandCaseDetails, CaseWithRelations } from "@/types/case";

export interface LandRegistryEntry {
  case_id: string;
  case_number: string;
  case_title: string;
  case_type: string;
  case_category: string | null;
  status: string;
  khasra_number: string;
  khewat_number: string | null;
  district: string;
  tehsil: string;
  mauza: string;
  total_area: string | null;
  land_type: string | null;
  mutation_number: string | null;
  revenue_officer: string | null;
  registration_authority: string | null;
  deed_number: string | null;
  deed_date: string | null;
  plaintiff_name: string | null;
  defendant_name: string | null;
  filing_date: string | null;
}

export interface LandRegistryFilters {
  district?: string;
  tehsil?: string;
  mauza?: string;
  khasra_number?: string;
  khewat_number?: string;
  mutation_number?: string;
  deed_number?: string;
  land_type?: "agricultural" | "residential" | "commercial" | "";
  case_type?: "land_revenue" | "land_transfer" | "";
}

export function useLandRevenue() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registryEntries, setRegistryEntries] = useState<LandRegistryEntry[]>([]);

  // ── Property registry lookup ──────────────────────────────────────────────
  const searchRegistry = useCallback(
    async (filters: LandRegistryFilters) => {
      if (!user) return { error: "Not authenticated", data: null };

      setIsLoading(true);
      try {
        const supabase = createClient();

        let query = supabase
          .from("land_case_details")
          .select(
            `
            *,
            cases:cases(
              id, case_number, title, case_type, case_category,
              status, plaintiff_name, defendant_name, filing_date
            )
          `
          )
          .order("created_at", { ascending: false });

        if (filters.khasra_number) {
          query = query.ilike("khasra_number", `%${filters.khasra_number}%`);
        }
        if (filters.khewat_number) {
          query = query.ilike("khewat_number", `%${filters.khewat_number}%`);
        }
        if (filters.district) {
          query = query.ilike("district", `%${filters.district}%`);
        }
        if (filters.tehsil) {
          query = query.ilike("tehsil", `%${filters.tehsil}%`);
        }
        if (filters.mauza) {
          query = query.ilike("mauza", `%${filters.mauza}%`);
        }
        if (filters.mutation_number) {
          query = query.ilike("mutation_number", `%${filters.mutation_number}%`);
        }
        if (filters.deed_number) {
          query = query.ilike("deed_number", `%${filters.deed_number}%`);
        }
        if (filters.land_type) {
          query = query.eq("land_type", filters.land_type);
        }

        const { data, error } = await query;

        if (error) return { error: error.message, data: null };

        // Shape the joined data and apply case_type filter client-side
        let entries: LandRegistryEntry[] = (data || [])
          .filter((row) => row.cases != null)
          .map((row) => {
            const c = row.cases as {
              id: string;
              case_number: string;
              title: string;
              case_type: string;
              case_category: string | null;
              status: string;
              plaintiff_name: string | null;
              defendant_name: string | null;
              filing_date: string | null;
            };
            return {
              case_id: c.id,
              case_number: c.case_number,
              case_title: c.title,
              case_type: c.case_type,
              case_category: c.case_category,
              status: c.status,
              khasra_number: row.khasra_number,
              khewat_number: row.khewat_number,
              district: row.district,
              tehsil: row.tehsil,
              mauza: row.mauza,
              total_area: row.total_area,
              land_type: row.land_type,
              mutation_number: row.mutation_number,
              revenue_officer: row.revenue_officer,
              registration_authority: row.registration_authority,
              deed_number: row.deed_number,
              deed_date: row.deed_date,
              plaintiff_name: c.plaintiff_name,
              defendant_name: c.defendant_name,
              filing_date: c.filing_date,
            };
          });

        if (filters.case_type) {
          entries = entries.filter((e) => e.case_type === filters.case_type);
        }

        setRegistryEntries(entries);
        return { error: null, data: entries };
      } catch (err) {
        console.error("Error searching land registry:", err);
        return { error: "Failed to search registry", data: null };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // ── Update land case details ─────────────────────────────────────────────
  const updateLandDetails = async (
    caseId: string,
    updates: Partial<
      Pick<
        LandCaseDetails,
        | "khasra_number"
        | "khewat_number"
        | "district"
        | "tehsil"
        | "mauza"
        | "total_area"
        | "land_type"
        | "mutation_number"
        | "revenue_officer"
        | "registration_authority"
        | "deed_number"
        | "deed_date"
      >
    >
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("land_case_details")
        .update(updates)
        .eq("case_id", caseId);

      if (error) return { error: error.message };

      await supabase.from("case_activity_log").insert({
        case_id: caseId,
        actor_id: user.id,
        action: "land_details_updated",
        details: updates,
      });

      return { error: null };
    } catch (err) {
      console.error("Error updating land details:", err);
      return { error: "Failed to update land details" };
    }
  };

  // ── Update mutation status / number ──────────────────────────────────────
  const updateMutation = async (
    caseId: string,
    mutationNumber: string,
    revenueOfficer?: string
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      const updateData: Record<string, string> = {
        mutation_number: mutationNumber,
      };
      if (revenueOfficer) updateData.revenue_officer = revenueOfficer;

      const { error } = await supabase
        .from("land_case_details")
        .update(updateData)
        .eq("case_id", caseId);

      if (error) return { error: error.message };

      await supabase.from("case_activity_log").insert({
        case_id: caseId,
        actor_id: user.id,
        action: "mutation_updated",
        details: { mutation_number: mutationNumber, revenue_officer: revenueOfficer },
      });

      return { error: null };
    } catch (err) {
      console.error("Error updating mutation:", err);
      return { error: "Failed to update mutation" };
    }
  };

  // ── Update deed details (for land transfer cases) ─────────────────────────
  const updateDeedDetails = async (
    caseId: string,
    deedNumber: string,
    deedDate: string,
    registrationAuthority?: string
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("land_case_details")
        .update({
          deed_number: deedNumber,
          deed_date: deedDate,
          registration_authority: registrationAuthority || null,
        })
        .eq("case_id", caseId);

      if (error) return { error: error.message };

      await supabase.from("case_activity_log").insert({
        case_id: caseId,
        actor_id: user.id,
        action: "deed_details_updated",
        details: { deed_number: deedNumber, deed_date: deedDate, registration_authority: registrationAuthority },
      });

      return { error: null };
    } catch (err) {
      console.error("Error updating deed details:", err);
      return { error: "Failed to update deed details" };
    }
  };

  // ── Fetch all land cases (revenue + transfer) ─────────────────────────────
  const fetchLandCases = useCallback(
    async (caseType?: "land_revenue" | "land_transfer") => {
      if (!user) return { error: "Not authenticated", data: null };

      setIsLoading(true);
      try {
        const supabase = createClient();

        let query = supabase
          .from("cases")
          .select(
            `
            *,
            plaintiff:profiles!plaintiff_id(id, full_name, email),
            defendant:profiles!defendant_id(id, full_name, email),
            assignments:case_assignments(
              id, lawyer_id, side, status, fee_amount,
              lawyer:profiles!lawyer_id(id, full_name, email)
            ),
            land_details:land_case_details(*)
          `
          )
          .order("created_at", { ascending: false });

        if (caseType) {
          query = query.eq("case_type", caseType);
        } else {
          query = query.in("case_type", ["land_revenue", "land_transfer"]);
        }

        // Role-based filtering
        if (user.role === "client") {
          query = query.or(`plaintiff_id.eq.${user.id},defendant_id.eq.${user.id}`);
        } else if (user.role === "trial_judge") {
          query = query.eq("trial_judge_id", user.id);
        } else if (user.role === "stenographer") {
          query = query.eq("stenographer_id", user.id);
        }

        const { data, error } = await query;

        if (error) return { error: error.message, data: null };

        return { error: null, data: (data as CaseWithRelations[]) || [] };
      } catch (err) {
        console.error("Error fetching land cases:", err);
        return { error: "Failed to fetch land cases", data: null };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    isLoading,
    registryEntries,
    searchRegistry,
    updateLandDetails,
    updateMutation,
    updateDeedDetails,
    fetchLandCases,
  };
}
