import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional().nullable(),
  priority: z.number().int().min(0).default(0),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.number().int().min(0).optional(),
});

export const setRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string().min(1)).default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;