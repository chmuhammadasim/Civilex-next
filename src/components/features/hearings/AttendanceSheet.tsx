"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useHearingAttendance } from "@/hooks/useHearingAttendance";
import {
  ATTENDANCE_ROLE_LABELS,
  ATTENDANCE_SIDE_LABELS,
  type AttendanceRole,
  type AttendanceSide,
  type HearingAttendance,
} from "@/types/trial";
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Props {
  hearingId: string;
  caseId: string;
  /** Can the current user record attendance? (court officials & stenographer) */
  canRecord: boolean;
}

const roleOptions = Object.entries(ATTENDANCE_ROLE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const sideOptions = [
  { value: "", label: "— Not applicable —" },
  ...Object.entries(ATTENDANCE_SIDE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const presenceBadge = (present: boolean) =>
  present ? (
    <Badge variant="success">Present</Badge>
  ) : (
    <Badge variant="danger">Absent</Badge>
  );

export default function AttendanceSheet({ hearingId, caseId, canRecord }: Props) {
  const { attendance, isLoading, addAttendee, togglePresence, removeAttendee } =
    useHearingAttendance(hearingId, caseId);

  const [showForm, setShowForm]         = useState(false);
  const [personName, setPersonName]     = useState("");
  const [personRole, setPersonRole]     = useState<AttendanceRole>("other");
  const [side, setSide]                 = useState<AttendanceSide | "">("");
  const [isPresent, setIsPresent]       = useState(true);
  const [notes, setNotes]               = useState("");
  const [isSaving, setIsSaving]         = useState(false);
  const [error, setError]               = useState("");
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [removingId, setRemovingId]     = useState<string | null>(null);

  function resetForm() {
    setPersonName("");
    setPersonRole("other");
    setSide("");
    setIsPresent(true);
    setNotes("");
    setError("");
  }

  async function handleAdd() {
    if (!personName.trim()) {
      setError("Name is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    const result = await addAttendee({
      person_name: personName.trim(),
      person_role: personRole,
      side: side || undefined,
      is_present: isPresent,
      notes: notes.trim() || undefined,
    });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
      setShowForm(false);
    }
  }

  async function handleToggle(entry: HearingAttendance) {
    setTogglingId(entry.id);
    await togglePresence(entry.id, !entry.is_present);
    setTogglingId(null);
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await removeAttendee(id);
    setRemovingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  const presentCount = attendance.filter((a) => a.is_present).length;
  const absentCount  = attendance.length - presentCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-primary">Attendance Sheet</h3>
          {attendance.length > 0 && (
            <div className="flex gap-1.5">
              <Badge variant="success">{presentCount} Present</Badge>
              {absentCount > 0 && (
                <Badge variant="danger">{absentCount} Absent</Badge>
              )}
            </div>
          )}
        </div>
        {canRecord && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Attendee
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && canRecord && (
        <Card>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Record Attendee
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="att_name"
              label="Full Name"
              placeholder="e.g. Mr. Hassan Ali"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
            <Select
              id="att_role"
              label="Role in Court"
              value={personRole}
              onChange={(e) => setPersonRole(e.target.value as AttendanceRole)}
              options={roleOptions}
            />
            <Select
              id="att_side"
              label="Side (if applicable)"
              value={side}
              onChange={(e) => setSide(e.target.value as AttendanceSide | "")}
              options={sideOptions}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Present?
              </label>
              <button
                type="button"
                onClick={() => setIsPresent((v) => !v)}
                className="flex items-center gap-2 text-sm"
              >
                {isPresent ? (
                  <>
                    <ToggleRight className="h-6 w-6 text-success" />
                    <span className="text-success font-medium">Present</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-6 w-6 text-muted" />
                    <span className="text-muted">Absent</span>
                  </>
                )}
              </button>
            </div>
            <div className="sm:col-span-2">
              <Input
                id="att_notes"
                label="Notes (optional)"
                placeholder="e.g. Appeared late, represented by associate, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-2 rounded-lg border border-danger bg-danger-light p-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleAdd}
            >
              <CheckCircle2 className="h-4 w-4" />
              Record
            </Button>
          </div>
        </Card>
      )}

      {/* Attendance table / list */}
      {attendance.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No Attendance Recorded"
          description={
            canRecord
              ? "Add attendees to record who appeared at this hearing."
              : "No attendance has been recorded for this hearing yet."
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-light text-left">
                  <th className="px-4 py-2 font-semibold text-foreground">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground">Name</th>
                  <th className="px-4 py-2 font-semibold text-foreground">Role</th>
                  <th className="px-4 py-2 font-semibold text-foreground">Side</th>
                  <th className="px-4 py-2 font-semibold text-foreground">Status</th>
                  <th className="px-4 py-2 font-semibold text-foreground">Notes</th>
                  {canRecord && (
                    <th className="px-4 py-2 font-semibold text-foreground text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {attendance.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={
                      entry.is_present
                        ? "border-b border-border hover:bg-cream-light/50"
                        : "border-b border-border bg-danger-light/30 hover:bg-danger-light/50"
                    }
                  >
                    <td className="px-4 py-2 text-muted">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-foreground">
                      {entry.person_name}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {ATTENDANCE_ROLE_LABELS[entry.person_role] ?? entry.person_role}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {entry.side
                        ? (ATTENDANCE_SIDE_LABELS[entry.side] ?? entry.side)
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {canRecord ? (
                        <button
                          type="button"
                          disabled={togglingId === entry.id}
                          onClick={() => handleToggle(entry)}
                          className="flex items-center gap-1 text-xs hover:opacity-80 disabled:opacity-50"
                        >
                          {togglingId === entry.id ? (
                            <Spinner size="sm" />
                          ) : entry.is_present ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="text-success">Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-danger" />
                              <span className="text-danger">Absent</span>
                            </>
                          )}
                        </button>
                      ) : (
                        presenceBadge(entry.is_present)
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted max-w-40 truncate">
                      {entry.notes ?? "—"}
                    </td>
                    {canRecord && (
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          disabled={removingId === entry.id}
                          onClick={() => handleRemove(entry.id)}
                          className="text-muted hover:text-danger disabled:opacity-50"
                        >
                          {removingId === entry.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
