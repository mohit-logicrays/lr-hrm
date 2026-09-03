import { z } from "zod";

export const createTimeLogSchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  hours: z.number().positive("Hours must be greater than 0").max(24, "Hours cannot exceed 24").optional(),
  durationSec: z.number().int().nonnegative().optional(),
  isBillable: z.boolean().default(true),
  isOvertime: z.boolean().default(false),
  description: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional().default("DRAFT"),
}).refine((data) => (data.hours !== undefined && data.hours > 0) || (data.durationSec !== undefined && data.durationSec > 0), {
  message: "Either hours or durationSec must be provided and greater than 0",
});

export const updateTimeLogSchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  date: z.string().optional(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  hours: z.number().positive("Hours must be greater than 0").max(24).optional(),
  durationSec: z.number().int().nonnegative().optional(),
  isBillable: z.boolean().optional(),
  isOvertime: z.boolean().optional(),
  description: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED", "PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const timeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "ALL"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const approveTimeLogSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional().nullable(),
});

export const bulkApproveTimeLogSchema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one timesheet entry"),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional().nullable(),
});

export const submitWeekSchema = z.object({
  weekStartDate: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
