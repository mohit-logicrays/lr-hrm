import { z } from "zod";

export const createHolidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["NATIONAL", "RESTRICTED", "COMPANY"]).default("NATIONAL"),
  isOptional: z.boolean().default(false),
  description: z.string().optional().nullable(),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  type: z.enum(["NATIONAL", "RESTRICTED", "COMPANY"]).optional(),
  isOptional: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

export const holidayQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  search: z.string().optional(),
  type: z.enum(["NATIONAL", "RESTRICTED", "COMPANY"]).optional(),
});

export const importHolidayRowSchema = z.object({
  name: z.string().min(1, "Holiday Name is required"),
  date: z.string().min(1, "Date is required (YYYY-MM-DD)"),
  type: z.enum(["NATIONAL", "RESTRICTED", "COMPANY"]).default("NATIONAL"),
  isOptional: z.boolean().default(false),
  description: z.string().optional().nullable(),
});

export const importHolidayPayloadSchema = z.object({
  holidays: z.array(importHolidayRowSchema),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type ImportHolidayRowInput = z.infer<typeof importHolidayRowSchema>;
