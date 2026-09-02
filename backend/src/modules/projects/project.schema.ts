import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const projectPriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const taskStatusEnum = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]);

export const taskPriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const milestoneStatusEnum = z.enum([
  "UPCOMING",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
]);

export const projectMemberRoleEnum = z.enum([
  "MEMBER",
  "LEAD",
  "PROJECT_MANAGER",
  "VIEWER",
]);

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.default("PLANNING"),
  priority: projectPriorityEnum.default("MEDIUM"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  primaryTeamId: z.string().optional().nullable(),
  projectManagerId: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  clientName: z.string().optional().nullable(),
  isBillable: z.boolean().default(true),
  category: z.string().optional().nullable(),
  visibility: z.string().default("Workspace"),
  initialMembers: z
    .array(
      z.object({
        userId: z.string(),
        roleInProject: projectMemberRoleEnum.default("MEMBER"),
      })
    )
    .optional(),
  initialMilestones: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.optional(),
  priority: projectPriorityEnum.optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  primaryTeamId: z.string().optional().nullable(),
  projectManagerId: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  clientName: z.string().optional().nullable(),
  isBillable: z.boolean().optional(),
  category: z.string().optional().nullable(),
  visibility: z.string().optional(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  priority: projectPriorityEnum.optional(),
  departmentId: z.string().optional(),
  primaryTeamId: z.string().optional(),
  projectManagerId: z.string().optional(),
  memberOnly: z.coerce.boolean().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  roleInProject: projectMemberRoleEnum.default("MEMBER"),
});

export const updateMemberSchema = z.object({
  roleInProject: projectMemberRoleEnum,
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  taskCode: z.string().optional().nullable(),
  status: taskStatusEnum.default("TODO"),
  priority: taskPriorityEnum.default("MEDIUM"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  labels: z.array(z.string()).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  order: z.number().optional(),
  isCompleted: z.boolean().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: milestoneStatusEnum.default("UPCOMING"),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: milestoneStatusEnum.optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
