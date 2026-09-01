import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  departmentId: z.string().min(1, "Department is required"),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  departmentId: z.string().min(1).optional(),
});

export const teamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  departmentId: z.string().optional(),
});

export const addMemberSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
  isTeamLead: z.boolean().optional().default(false),
});

export const updateMemberSchema = z.object({
  isTeamLead: z.boolean().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
