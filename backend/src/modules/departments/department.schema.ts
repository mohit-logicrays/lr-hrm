import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, dashes and underscores"),
  description: z.string().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
