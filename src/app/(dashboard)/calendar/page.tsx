"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";

interface CalendarHearing {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  hearing_number: number;
  hearing_type: string;
  scheduled_date: string;
  courtroom: string | null;
  status: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function hearingStatusBg(status: string) {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800 border-green-200";
    case "adjourned": return "bg-amber-100 text-amber-800 border-amber-200";
    case "cancelled": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export default function CalendarPage() {
  const { user } = useAuth();
  const todayDate = new Date();
  const [current, setCurrent] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  );
  const [hearings, setHearings] = useState<CalendarHearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(todayDate.getDate());

  const year = current.getFullYear();
  const month = current.getMonth();

  const fetchHearings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
      const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("hearings")
        .select(`
          id, case_id, hearing_number, hearing_type, scheduled_date, courtroom, status,
          case:cases!inner(case_number, title)
        `)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate + "T23:59:59")
        .order("scheduled_date", { ascending: true });

      if (error) {
        console.error("Error fetching calendar hearings:", error);
      } else {
        const mapped = (data || []).map((h: Record<string, unknown>) => {
          const caseData = h.case as { case_number: string; title: string } | null;
          return {
            id: h.id as string,
            case_id: h.case_id as string,
            case_number: caseData?.case_number || "",
            case_title: caseData?.title || "",
            hearing_number: h.hearing_number as number,
            hearing_type: h.hearing_type as string,
            scheduled_date: h.scheduled_date as string,
            courtroom: h.courtroom as string | null,
            status: h.status as string,
          };
        });
        setHearings(mapped);
      }
    } catch (err) {
      console.error("Error fetching calendar hearings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => {
    fetchHearings();
  }, [fetchHearings]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from(
    { length: firstDayOfMonth + daysInMonth },
    (_, i) => (i < firstDayOfMonth ? null : i - firstDayOfMonth + 1)
  );
  while (cells.length % 7 !== 0) cells.push(null);

  // Group hearings by day number
  const hearingsByDay: Record<number, CalendarHearing[]> = {};
  for (const h of hearings) {
    const d = new Date(h.scheduled_date).getDate();
    if (!hearingsByDay[d]) hearingsByDay[d] = [];
    hearingsByDay[d].push(h);
  }

  const isToday = (day: number) =>
    todayDate.getFullYear() === year &&
    todayDate.getMonth() === month &&
    todayDate.getDate() === day;

  const selectedHearings = selectedDay ? (hearingsByDay[selectedDay] || []) : [];

  return (
    <div>
      <Topbar title="Hearing Calendar" />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar grid */}
          <div className="lg:col-span-2">
            <Card>
              {/* Month navigation */}
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDay(null);
                    setCurrent(new Date(year, month - 1, 1));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-bold text-primary">
                  {MONTHS[month]} {year}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDay(null);
                    setCurrent(new Date(year, month + 1, 1));
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 text-center">
                {DAYS.map((d) => (
                  <div key={d} className="py-1 text-xs font-semibold text-muted">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="grid grid-cols-7 border-l border-t border-border">
                  {cells.map((day, i) => {
                    const dayHearings = day ? (hearingsByDay[day] || []) : [];
                    const today_ = day ? isToday(day) : false;
                    const selected = day === selectedDay;
                    return (
                      <div
                        key={i}
                        onClick={() => day && setSelectedDay(day)}
                        className={`min-h-[72px] cursor-pointer border-b border-r border-border p-1 transition-colors ${
                          day ? "hover:bg-cream-dark/40" : "bg-cream-dark/20 cursor-default"
                        } ${selected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                      >
                        {day && (
                          <>
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                today_ ? "bg-primary text-white" : "text-foreground"
                              }`}
                            >
                              {day}
                            </span>
                            <div className="mt-0.5 space-y-0.5">
                              {dayHearings.slice(0, 2).map((h) => (
                                <div
                                  key={h.id}
                                  className={`truncate rounded border px-1 py-0.5 text-[10px] font-medium ${hearingStatusBg(h.status)}`}
                                  title={`${h.case_title} — Hearing #${h.hearing_number}`}
                                >
                                  #{h.hearing_number} {h.case_number}
                                </div>
                              ))}
                              {dayHearings.length > 2 && (
                                <div className="px-1 text-[10px] text-muted">
                                  +{dayHearings.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-primary">
                  {selectedDay
                    ? `${MONTHS[month]} ${selectedDay}, ${year}`
                    : "Select a day"}
                </h3>
              </div>

              {!selectedDay && (
                <p className="text-sm text-muted">Click on a day to see its hearings.</p>
              )}
              {selectedDay && selectedHearings.length === 0 && (
                <p className="text-sm text-muted">No hearings scheduled.</p>
              )}

              <div className="space-y-3">
                {selectedHearings.map((h) => (
                  <Link
                    key={h.id}
                    href={`/cases/${h.case_id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-cream-dark/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {h.case_title}
                        </p>
                        <p className="text-xs text-muted">{h.case_number}</p>
                        <p className="text-xs text-muted">
                          Hearing #{h.hearing_number} · {h.hearing_type.replace(/_/g, " ")}
                        </p>
                        {h.courtroom && (
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <MapPin className="h-3 w-3" />
                            {h.courtroom}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          h.status === "completed"
                            ? "success"
                            : h.status === "adjourned"
                              ? "warning"
                              : h.status === "cancelled"
                                ? "danger"
                                : "primary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {h.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Legend */}
            <Card padding="sm">
              <h4 className="mb-2 text-sm font-semibold text-muted">Legend</h4>
              <div className="space-y-1.5">
                {[
                  { label: "Scheduled", color: "bg-blue-100 border-blue-200" },
                  { label: "Completed", color: "bg-green-100 border-green-200" },
                  { label: "Adjourned", color: "bg-amber-100 border-amber-200" },
                  { label: "Cancelled", color: "bg-red-100 border-red-200" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`inline-block h-3 w-8 rounded border ${color}`} />
                    <span className="text-xs text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick nav to today */}
            {(year !== todayDate.getFullYear() || month !== todayDate.getMonth()) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setCurrent(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
                  setSelectedDay(todayDate.getDate());
                }}
              >
                <Calendar className="h-4 w-4" />
                Jump to Today
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
