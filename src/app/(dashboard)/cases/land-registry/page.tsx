"use client";

import { useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useLandRevenue } from "@/hooks/useLandRevenue";
import type { LandRegistryFilters } from "@/hooks/useLandRevenue";
import { CASE_STATUS_LABELS, CASE_CATEGORY_LABELS } from "@/lib/constants";
import type { CaseStatus, CaseCategory } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  Search,
  MapPin,
  Hash,
  Landmark,
  FileText,
  ArrowRight,
  CalendarDays,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

const landTypeOptions = [
  { value: "", label: "All land types" },
  { value: "agricultural", label: "Agricultural" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

const caseTypeOptions = [
  { value: "", label: "All case types" },
  { value: "land_revenue", label: "Land Revenue" },
  { value: "land_transfer", label: "Land Transfer" },
];

export default function LandRegistryPage() {
  const { isLoading, registryEntries, searchRegistry } = useLandRevenue();

  const [filters, setFilters] = useState<LandRegistryFilters>({
    khasra_number: "",
    khewat_number: "",
    district: "",
    tehsil: "",
    mauza: "",
    mutation_number: "",
    deed_number: "",
    land_type: "",
    case_type: "",
  });
  const [hasSearched, setHasSearched] = useState(false);

  const setF = (key: keyof LandRegistryFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleSearch = async () => {
    // Strip empty strings so they don't filter
    const active: LandRegistryFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "")
    );
    await searchRegistry(active);
    setHasSearched(true);
  };

  const handleReset = () => {
    setFilters({
      khasra_number: "",
      khewat_number: "",
      district: "",
      tehsil: "",
      mauza: "",
      mutation_number: "",
      deed_number: "",
      land_type: "",
      case_type: "",
    });
    setHasSearched(false);
  };

  const hasActiveFilter = Object.values(filters).some((v) => v !== "");

  return (
    <div>
      <Topbar title="Property Registry Lookup" />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
            <Search className="h-5 w-5" />
            Property Registry Lookup
          </h2>
          <p className="mt-1 text-sm text-muted">
            Search land cases by location (district, tehsil, mauza), Khasra No.,
            deed number, or mutation number
          </p>
        </div>

        {/* Filter card */}
        <Card padding="md" className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Khasra Number"
              placeholder="e.g. 123/1"
              value={filters.khasra_number}
              onChange={(e) => setF("khasra_number", e.target.value)}
              leftIcon={<Hash className="h-4 w-4 text-muted" />}
            />
            <Input
              label="Khewat / Khatauni Number"
              placeholder="e.g. 45"
              value={filters.khewat_number}
              onChange={(e) => setF("khewat_number", e.target.value)}
            />
            <Input
              label="Mutation Number (Intiqal)"
              placeholder="e.g. 789"
              value={filters.mutation_number}
              onChange={(e) => setF("mutation_number", e.target.value)}
            />
            <Input
              label="Deed Number"
              placeholder="e.g. D-2024-1234"
              value={filters.deed_number}
              onChange={(e) => setF("deed_number", e.target.value)}
            />
            <Input
              label="District"
              placeholder="e.g. Lahore"
              value={filters.district}
              onChange={(e) => setF("district", e.target.value)}
              leftIcon={<MapPin className="h-4 w-4 text-muted" />}
            />
            <Input
              label="Tehsil"
              placeholder="e.g. Model Town"
              value={filters.tehsil}
              onChange={(e) => setF("tehsil", e.target.value)}
            />
            <Input
              label="Mauza (Village / Locality)"
              placeholder="e.g. Gulberg"
              value={filters.mauza}
              onChange={(e) => setF("mauza", e.target.value)}
            />
            <Select
              label="Land Type"
              value={filters.land_type ?? ""}
              onChange={(e) =>
                setF(
                  "land_type",
                  e.target.value as "agricultural" | "residential" | "commercial" | ""
                )
              }
              options={landTypeOptions}
            />
            <Select
              label="Case Type"
              value={filters.case_type ?? ""}
              onChange={(e) =>
                setF("case_type", e.target.value as "land_revenue" | "land_transfer" | "")
              }
              options={caseTypeOptions}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              leftIcon={<Search className="h-4 w-4" />}
            >
              {isLoading ? "Searching..." : "Search Registry"}
            </Button>
            {hasActiveFilter && (
              <Button variant="outline" onClick={handleReset} leftIcon={<RotateCcw className="h-4 w-4" />}>
                Reset
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : hasSearched && registryEntries.length === 0 ? (
          <EmptyState
            title="No matching properties found"
            description="Try adjusting your search filters to find the property record."
            icon={<MapPin className="h-12 w-12" />}
          />
        ) : hasSearched ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {registryEntries.length} record{registryEntries.length !== 1 ? "s" : ""} found
            </p>
            {registryEntries.map((entry) => (
              <Link key={entry.case_id} href={`/cases/${entry.case_id}`}>
                <Card padding="md" className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          entry.case_type === "land_revenue"
                            ? "bg-amber-50"
                            : "bg-emerald-50"
                        }`}
                      >
                        {entry.case_type === "land_revenue" ? (
                          <Landmark className="h-5 w-5 text-amber-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {entry.case_title}
                        </h3>
                        <p className="text-sm text-muted">
                          {entry.case_number}
                          {entry.case_category && (
                            <>
                              {" • "}
                              {CASE_CATEGORY_LABELS[entry.case_category as CaseCategory] ??
                                entry.case_category}
                            </>
                          )}
                        </p>

                        {/* Land record details */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Khasra: {entry.khasra_number}
                          </span>
                          {entry.khewat_number && (
                            <span>Khewat: {entry.khewat_number}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[entry.mauza, entry.tehsil, entry.district]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                          {entry.total_area && (
                            <span>{entry.total_area}</span>
                          )}
                          {entry.mutation_number && (
                            <span>Intiqal: {entry.mutation_number}</span>
                          )}
                          {entry.deed_number && (
                            <span>Deed: {entry.deed_number}</span>
                          )}
                          {entry.deed_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(entry.deed_date)}
                            </span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge
                            variant={
                              entry.status === "registered" || entry.status === "judgment_delivered"
                                ? "success"
                                : entry.status.includes("pending") || entry.status === "draft"
                                ? "warning"
                                : "info"
                            }
                          >
                            {CASE_STATUS_LABELS[entry.status as CaseStatus] ||
                              entry.status.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant={entry.case_type === "land_revenue" ? "warning" : "success"}>
                            {entry.case_type === "land_revenue" ? "Land Revenue" : "Land Transfer"}
                          </Badge>
                          {entry.land_type && (
                            <Badge variant="default">
                              {entry.land_type.charAt(0).toUpperCase() +
                                entry.land_type.slice(1)}
                            </Badge>
                          )}
                        </div>

                        {/* Parties and filing date */}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                          {entry.plaintiff_name && (
                            <span>Petitioner: {entry.plaintiff_name}</span>
                          )}
                          {entry.defendant_name && (
                            <span>Respondent: {entry.defendant_name}</span>
                          )}
                          {entry.filing_date && (
                            <span>Filed: {formatDate(entry.filing_date)}</span>
                          )}
                          {entry.revenue_officer && (
                            <span>Revenue Officer: {entry.revenue_officer}</span>
                          )}
                          {entry.registration_authority && (
                            <span>Registrar: {entry.registration_authority}</span>
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
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">
              Enter at least one filter above and click{" "}
              <strong>Search Registry</strong> to look up property records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
