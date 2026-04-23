"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { useWrittenStatement } from "@/hooks/useWrittenStatement";
import { formatDateTime } from "@/lib/utils";
import type { SpecificResponse } from "@/types/trial";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  caseId: string;
  /** Is the current user the defendant's lawyer on this case? */
  isDefendantLawyer: boolean;
}

const admissionOptions = [
  { value: "denied",    label: "Denied" },
  { value: "admitted",  label: "Admitted" },
  { value: "not_known", label: "Not Known / Cannot Admit or Deny" },
];

const admissionVariant: Record<string, "danger" | "success" | "warning"> = {
  denied:    "danger",
  admitted:  "success",
  not_known: "warning",
};

export default function WrittenStatementPanel({ caseId, isDefendantLawyer }: Props) {
  const { statement, isLoading, createDraft, updateDraft, fileStatement } =
    useWrittenStatement(caseId);

  // ── Local edit state ────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [isFiling, setIsFiling]   = useState(false);
  const [error, setError]         = useState("");

  const [generalDenial, setGeneralDenial]               = useState("");
  const [preliminaryObjections, setPreliminaryObjections] = useState("");
  const [counterArguments, setCounterArguments]           = useState("");
  const [reliefSought, setReliefSought]                   = useState("");
  const [witnessInput, setWitnessInput]                   = useState("");
  const [witnessNames, setWitnessNames]                   = useState<string[]>([]);
  const [responses, setResponses]                         = useState<SpecificResponse[]>([]);

  // Track which allegation rows are expanded for editing
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  function openEditor() {
    if (statement) {
      setGeneralDenial(statement.general_denial ?? "");
      setPreliminaryObjections(statement.preliminary_objections ?? "");
      setCounterArguments(statement.counter_arguments ?? "");
      setReliefSought(statement.relief_sought ?? "");
      setWitnessNames(statement.witness_names ?? []);
      setResponses(statement.specific_responses ?? []);
    } else {
      setGeneralDenial("");
      setPreliminaryObjections("");
      setCounterArguments("");
      setReliefSought("");
      setWitnessNames([]);
      setResponses([]);
    }
    setExpandedRows(new Set());
    setError("");
    setIsEditing(true);
  }

  const buildPayload = () => ({
    general_denial:         generalDenial.trim() || undefined,
    specific_responses:     responses,
    preliminary_objections: preliminaryObjections.trim() || undefined,
    counter_arguments:      counterArguments.trim() || undefined,
    relief_sought:          reliefSought.trim() || undefined,
    witness_names:          witnessNames,
  });

  async function handleSave() {
    setIsSaving(true);
    setError("");
    const payload = buildPayload();
    let result: { error: string | null };
    if (statement) {
      result = await updateDraft(statement.id, payload);
    } else {
      const r = await createDraft(payload);
      result = { error: r.error };
    }
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setIsEditing(false);
    }
  }

  async function handleFile() {
    if (!statement) return;
    setIsFiling(true);
    setError("");
    const result = await fileStatement(statement.id);
    setIsFiling(false);
    if (result.error) setError(result.error);
  }

  // ── Allegation rows ──────────────────────────────────────────────────────
  function addAllegationRow() {
    const next: SpecificResponse = {
      allegation_number: responses.length + 1,
      allegation_summary: "",
      response: "",
      admission: "denied",
    };
    setResponses((prev) => [...prev, next]);
    setExpandedRows((prev) => new Set([...prev, next.allegation_number]));
  }

  function updateResponse(idx: number, patch: Partial<SpecificResponse>) {
    setResponses((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  }

  function removeResponse(idx: number) {
    setResponses((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, allegation_number: i + 1 }))
    );
  }

  function toggleExpand(n: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function addWitness() {
    const name = witnessInput.trim();
    if (!name) return;
    setWitnessNames((prev) => [...prev, name]);
    setWitnessInput("");
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Read-only view ────────────────────────────────────────────────────────
  if (statement && !isEditing) {
    const isFiled = statement.status === "filed";
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-primary">Written Statement</h3>
            <Badge variant={isFiled ? "success" : "warning"}>
              {isFiled ? "Filed" : "Draft"}
            </Badge>
          </div>
          <div className="flex gap-2">
            {isDefendantLawyer && !isFiled && (
              <>
                <Button size="sm" variant="outline" onClick={openEditor}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="primary" isLoading={isFiling} onClick={handleFile}>
                  <Send className="h-4 w-4" />
                  File with Court
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-danger bg-danger-light p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isFiled && statement.filed_at && (
          <p className="text-xs text-muted">
            Filed by {statement.filer?.full_name ?? "Lawyer"} on{" "}
            {formatDateTime(statement.filed_at)}
          </p>
        )}

        {statement.preliminary_objections && (
          <Card>
            <h4 className="mb-1 text-sm font-semibold text-foreground">
              Preliminary Objections
            </h4>
            <p className="whitespace-pre-wrap text-sm text-muted">
              {statement.preliminary_objections}
            </p>
          </Card>
        )}

        {statement.general_denial && (
          <Card>
            <h4 className="mb-1 text-sm font-semibold text-foreground">
              General Position / Denial
            </h4>
            <p className="whitespace-pre-wrap text-sm text-muted">
              {statement.general_denial}
            </p>
          </Card>
        )}

        {statement.specific_responses.length > 0 && (
          <Card>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Response to Allegations
            </h4>
            <div className="space-y-2">
              {statement.specific_responses.map((r) => (
                <div
                  key={r.allegation_number}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted">
                      #{r.allegation_number}
                    </span>
                    <Badge variant={admissionVariant[r.admission]}>
                      {r.admission.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {r.allegation_summary && (
                    <p className="mt-1 text-xs text-muted italic">
                      Allegation: {r.allegation_summary}
                    </p>
                  )}
                  {r.response && (
                    <p className="mt-1 text-sm text-foreground">{r.response}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {statement.counter_arguments && (
          <Card>
            <h4 className="mb-1 text-sm font-semibold text-foreground">
              Counter-Arguments
            </h4>
            <p className="whitespace-pre-wrap text-sm text-muted">
              {statement.counter_arguments}
            </p>
          </Card>
        )}

        {statement.relief_sought && (
          <Card>
            <h4 className="mb-1 text-sm font-semibold text-foreground">
              Relief Sought by Defendant
            </h4>
            <p className="whitespace-pre-wrap text-sm text-muted">
              {statement.relief_sought}
            </p>
          </Card>
        )}

        {statement.witness_names && statement.witness_names.length > 0 && (
          <Card>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Provisional Witness List ({statement.witness_names.length})
            </h4>
            <ul className="space-y-1">
              {statement.witness_names.map((name, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                    {i + 1}
                  </span>
                  {name}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  // ── Editor / empty state ──────────────────────────────────────────────────
  if (!statement && !isEditing) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No Written Statement Filed"
        description={
          isDefendantLawyer
            ? "As the defendant's lawyer, you must file a written statement in response to the plaintiff's plaint before the first hearing."
            : "The defendant's lawyer has not yet filed a written statement."
        }
        action={
          isDefendantLawyer ? (
            <Button variant="primary" onClick={openEditor}>
              <Plus className="h-4 w-4" />
              Prepare Written Statement
            </Button>
          ) : undefined
        }
      />
    );
  }

  // ── Edit form ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          {statement ? "Edit Written Statement" : "Prepare Written Statement"}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Preliminary Objections */}
      <Card>
        <Textarea
          id="preliminary_objections"
          label="Preliminary Objections (Optional)"
          placeholder="Raise any preliminary objections regarding jurisdiction, limitation period, maintainability, etc."
          value={preliminaryObjections}
          rows={3}
          onChange={(e) => setPreliminaryObjections(e.target.value)}
        />
      </Card>

      {/* General Position */}
      <Card>
        <Textarea
          id="general_denial"
          label="General Position / Denial"
          placeholder="State the defendant's overall position on the case. E.g. 'The defendant denies all allegations and states that...'"
          value={generalDenial}
          rows={4}
          onChange={(e) => setGeneralDenial(e.target.value)}
        />
      </Card>

      {/* Per-allegation responses */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Response to Specific Allegations ({responses.length})
          </h4>
          <Button size="sm" variant="outline" onClick={addAllegationRow}>
            <Plus className="h-4 w-4" />
            Add Allegation
          </Button>
        </div>

        {responses.length === 0 ? (
          <p className="text-sm text-muted">
            No allegations added yet. Click Add Allegation to respond to each
            numbered allegation in the plaint.
          </p>
        ) : (
          <div className="space-y-3">
            {responses.map((r, idx) => {
              const expanded = expandedRows.has(r.allegation_number);
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-cream-light"
                >
                  <div
                    className="flex cursor-pointer items-center justify-between p-3"
                    onClick={() => toggleExpand(r.allegation_number)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                        {r.allegation_number}
                      </span>
                      <Badge variant={admissionVariant[r.admission]}>
                        {r.admission.replace(/_/g, " ")}
                      </Badge>
                      {r.response && (
                        <span className="truncate text-xs text-muted max-w-50">
                          {r.response}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Remove allegation"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeResponse(idx);
                        }}
                        className="rounded p-1 text-muted hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted" />
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-3 border-t border-border p-3">
                      <Input
                        id={`allegation_summary_${idx}`}
                        label="Allegation Summary (from plaint)"
                        placeholder="Summarise what the plaintiff alleged in this paragraph"
                        value={r.allegation_summary}
                        onChange={(e) =>
                          updateResponse(idx, { allegation_summary: e.target.value })
                        }
                      />
                      <Select
                        id={`admission_${idx}`}
                        label="Admission / Denial"
                        value={r.admission}
                        onChange={(e) =>
                          updateResponse(idx, {
                            admission: e.target.value as SpecificResponse["admission"],
                          })
                        }
                        options={admissionOptions}
                      />
                      <Textarea
                        id={`response_${idx}`}
                        label="Defendant's Response"
                        placeholder="Explain the defendant's position on this allegation"
                        value={r.response}
                        rows={3}
                        onChange={(e) =>
                          updateResponse(idx, { response: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Counter Arguments */}
      <Card>
        <Textarea
          id="counter_arguments"
          label="Counter-Arguments"
          placeholder="Set out the defendant's own positive case, legal arguments, and any counter-claims"
          value={counterArguments}
          rows={4}
          onChange={(e) => setCounterArguments(e.target.value)}
        />
      </Card>

      {/* Relief Sought */}
      <Card>
        <Textarea
          id="relief_sought"
          label="Relief Sought by Defendant"
          placeholder="State what the defendant is asking the court to order. E.g. dismissal of the suit, costs, counter-claim relief, etc."
          value={reliefSought}
          rows={3}
          onChange={(e) => setReliefSought(e.target.value)}
        />
      </Card>

      {/* Provisional Witness List */}
      <Card>
        <h4 className="mb-3 text-sm font-semibold text-foreground">
          Provisional Witness List ({witnessNames.length})
        </h4>
        <div className="flex gap-2">
          <Input
            id="witness_input"
            placeholder="Witness full name"
            value={witnessInput}
            onChange={(e) => setWitnessInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWitness();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addWitness}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {witnessNames.length > 0 && (
          <ul className="mt-3 space-y-1">
            {witnessNames.map((name, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm"
              >
                <span>{name}</span>
                <button
                  type="button"
                  aria-label="Remove witness"
                  onClick={() =>
                    setWitnessNames((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-muted hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <Button variant="primary" isLoading={isSaving} onClick={handleSave}>
          <CheckCircle2 className="h-4 w-4" />
          Save Draft
        </Button>
      </div>
    </div>
  );
}
