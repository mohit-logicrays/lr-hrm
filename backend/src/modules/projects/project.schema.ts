import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.default("PLANNING"),
  teamId: z.string().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.optional(),
  teamId: z.string().optional().nullable(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  teamId: z.string().optional(),
});

export const addMemberSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  projectRole: z.string().optional().nullable(),
});

export const updateMemberSchema = z.object({
  projectRole: z.string().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
