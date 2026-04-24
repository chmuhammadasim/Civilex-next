import { z } from "zod";

const HEARING_TYPES = [
  "preliminary",
  "regular",
  "framing_of_issues",
  "evidence_recording",
  "cross_examination",
  "final_arguments",
  "arguments",
  "judgment",
  "bail",
  "miscellaneous",
] as const;

export const scheduleHearingSchema = z.object({
  /** ISO date string (date portion only, e.g. "2026-04-15"). */
  hearing_date: z
    .string()
    .min(1, "Hearing date is required")
    .refine(
      (v) => !Number.isNaN(Date.parse(v)),
      "Please enter a valid date"
    )
    .refine(
      (v) => new Date(v) > new Date(),
      "Hearing date must be in the future"
    ),

  hearing_type: z.enum(HEARING_TYPES, "Please select a valid hearing type"),

  presiding_officer_id: z
    .string()
    .uuid("Presiding officer ID must be a valid UUID")
    .optional()
    .or(z.literal("")),

  courtroom: z.string().max(100, "Courtroom must be 100 characters or fewer").optional(),

  notes: z.string().max(1000, "Notes must be 1000 characters or fewer").optional(),
});

export type ScheduleHearingInput = z.infer<typeof scheduleHearingSchema>;

export const orderSheetSchema = z.object({
  hearing_id: z.string().uuid("Invalid hearing ID"),

  order_type: z.enum(
    ["interim", "final", "adjournment", "summon", "bail", "transfer", "miscellaneous"] as const,
    "Please select a valid order type"
  ),

  order_text: z
    .string()
    .min(10, "Order text must be at least 10 characters")
    .max(5000, "Order text must be 5000 characters or fewer"),
});

export type OrderSheetInput = z.infer<typeof orderSheetSchema>;
