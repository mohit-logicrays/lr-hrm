import { z } from "zod";

export const createTimeLogSchema = z
  .object({
    projectId: z.string().optional().nullable(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    description: z.string().optional().nullable(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateTimeLogSchema = z
  .object({
    projectId: z.string().optional().nullable(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  })
  .refine(
    (data) =>
      !(data.startTime && data.endTime) ||
      new Date(data.endTime) > new Date(data.startTime),
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const timeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const approveTimeLogSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
