import { z } from "zod";

export const createHolidaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  isOptional: z.boolean().default(false),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  isOptional: z.boolean().optional(),
});

export const holidayQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  search: z.string().optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
