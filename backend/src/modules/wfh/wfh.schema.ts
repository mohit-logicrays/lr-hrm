import { z } from "zod";

export const createWFHSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  days: z.number().min(0.5).default(1),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  attachmentUrl: z.string().nullable().optional(),
});

export const approveWFHSchema = z.object({
  comment: z.string().optional(),
});

export const rejectWFHSchema = z.object({
  reason: z.string().min(2, "Rejection reason is required"),
});

export type CreateWFHInput = z.infer<typeof createWFHSchema>;
