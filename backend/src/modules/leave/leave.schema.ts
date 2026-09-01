import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
  isPaid: z.boolean().default(true),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().min(1).optional(),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
  isPaid: z.boolean().optional(),
});

export const leaveTypeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional().nullable(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const leaveRequestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const approveLeaveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional().nullable(),
});

export const allocateLeaveSchema = z.object({
  userId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  allocated: z.number().nonnegative(),
});

export const updateBalanceSchema = z.object({
  allocated: z.number().nonnegative().optional(),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type AllocateLeaveInput = z.infer<typeof allocateLeaveSchema>;
