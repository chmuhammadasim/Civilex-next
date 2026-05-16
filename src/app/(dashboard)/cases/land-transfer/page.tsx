"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useLandRevenue } from "@/hooks/useLandRevenue";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { CASE_STATUS_LABELS, CASE_CATEGORY_LABELS } from "@/lib/constants";
import type { CaseStatus, CaseCategory } from "@/lib/constants";
import type { CaseWithRelations } from "@/types/case";
import {
  FileText,
  MapPin,
  Search,
  ArrowRight,
  Shield,
  Landmark,
  Hash,
  CalendarDays,
  Plus,
} from "lucide-react";
import Link from "next/link";

type FilterTab = "all" | "sale_deed" | "gift_deed" | "general";

const FILTER_CATEGORIES: Record<Exclude<FilterTab, "all">, string> = {
  sale_deed: "land_sale_deed",
  gift_deed: "land_gift_deed",
  general: "land_transfer",
};

export default function LandTransferPage() {
  const { user } = useAuth();
  const { isLoading, fetchLandCases } = useLandRevenue();
  const [cases, setCases] = useState<CaseWithRelations[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const isCourtOfficial =
    user && ["admin_court", "trial_judge", "lawyer"].includes(user.role);
  const isClient = user?.role === "client";

  useEffect(() => {
    fetchLandCases("land_transfer").then(({ data }) => {
      if (data) setCases(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isCourtOfficial && !isClient) {
    return (
      <div>
        <Topbar title="Land Transfer Cases" />
        <div className="p-6">
          <EmptyState
            title="Access Restricted"
            description="You do not have access to the land transfer cases dashboard."
            icon={<Shield className="h-12 w-12" />}
          />
        </div>
      </div>
    );
  }

  const searchLower = search.toLowerCase();

  const filtered = cases.filter((c) => {
    const matchesFilter =
      filter === "all" ||
      c.case_category === FILTER_CATEGORIES[filter as Exclude<FilterTab, "all">];

    const matchesSearch =
      !searchLower ||
      c.title.toLowerCase().includes(searchLower) ||
      c.case_number.toLowerCase().includes(searchLower) ||
      (c.land_details?.khasra_number?.toLowerCase().includes(searchLower) ?? false) ||
      (c.land_details?.deed_number?.toLowerCase().includes(searchLower) ?? false) ||
      (c.land_details?.district?.toLowerCase().includes(searchLower) ?? false) ||
      (c.land_details?.mauza?.toLowerCase().includes(searchLower) ?? false) ||
      (c.plaintiff_name?.toLowerCase().includes(searchLower) ?? false) ||
      (c.defendant_name?.toLowerCase().includes(searchLower) ?? false);

    return matchesFilter && matchesSearch;
  });

  const countByCategory = (cat: string) =>
    cases.filter((c) => c.case_category === cat).length;

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Transfer Cases", count: cases.length },
    { id: "sale_deed", label: "Sale Deed (Bai Nama)", count: countByCategory("land_sale_deed") },
    { id: "gift_deed", label: "Gift Deed (Hiba Nama)", count: countByCategory("land_gift_deed") },
    { id: "general", label: "General Transfer", count: countByCategory("land_transfer") },
  ];

  return (
    <div>
      <Topbar title="Land Transfer Cases" />

      <div className="p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
              <FileText className="h-5 w-5" />
              Land Transfer Cases
            </h2>
            <p className="mt-1 text-sm text-muted">
              Manage sale deeds, gift deeds, and property transfer registrations
            </p>
          </div>
          {isClient && (
            <Link href="/cases/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                File New Case
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search by title, case number, deed number, Khasra No., or party name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-muted" />}
          />
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
          {filterTabs.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}{" "}
              <span className="ml-1 rounded-full bg-cream-dark px-2 py-0.5 text-xs">
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/cases/land-registry">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Property Registry Lookup
            </Button>
          </Link>
          <Link href="/cases/land-revenue">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Landmark className="h-4 w-4" />}
            >
              Land Revenue Cases
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No land transfer cases"
            description={
              search
                ? `No cases match "${search}".`
                : filter === "all"
                ? "No land transfer cases found."
                : `No ${filterTabs.find((f) => f.id === filter)?.label} cases found.`
            }
            icon={<FileText className="h-12 w-12" />}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <Card padding="md" className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {c.title}
                        </h3>
                        <p className="text-sm text-muted">
                          {c.case_number}
                          {c.case_category && (
                            <>
                              {" • "}
                              {CASE_CATEGORY_LABELS[c.case_category as CaseCategory] ?? c.case_category}
                            </>
                          )}
                        </p>

                        {/* Land / deed details row */}
                        {c.land_details && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Khasra: {c.land_details.khasra_number}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[c.land_details.mauza, c.land_details.tehsil, c.land_details.district]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                            {c.land_details.deed_number && (
                              <span>Deed: {c.land_details.deed_number}</span>
                            )}
                            {c.land_details.deed_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(c.land_details.deed_date)}
                              </span>
                            )}
                            {c.land_details.registration_authority && (
                              <span>Registrar: {c.land_details.registration_authority}</span>
                            )}
                          </div>
                        )}

                        {/* Status and type badges */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge
                            variant={
                              c.status === "registered" || c.status === "judgment_delivered"
                                ? "success"
                                : c.status.includes("pending") || c.status === "draft"
                                ? "warning"
                                : "info"
                            }
                          >
                            {CASE_STATUS_LABELS[c.status as CaseStatus] ||
                              c.status.replace(/_/g, " ")}
                          </Badge>
                          {c.land_details?.land_type && (
                            <Badge variant="default">
                              {c.land_details.land_type.charAt(0).toUpperCase() +
                                c.land_details.land_type.slice(1)}
                            </Badge>
                          )}
                          {c.land_details?.total_area && (
                            <Badge variant="info">{c.land_details.total_area}</Badge>
                          )}
                        </div>

                        {/* Parties and date */}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                          {(c.plaintiff?.full_name || c.plaintiff_name) && (
                            <span>
                              Transferor:{" "}
                              {c.plaintiff?.full_name ?? c.plaintiff_name}
                            </span>
                          )}
                          {(c.defendant?.full_name || c.defendant_name) && (
                            <span>
                              Transferee:{" "}
                              {c.defendant?.full_name ?? c.defendant_name}
                            </span>
                          )}
                          {c.filing_date && (
                            <span>Filed: {formatDate(c.filing_date)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
