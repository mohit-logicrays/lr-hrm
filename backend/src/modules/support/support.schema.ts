import { z } from "zod";

export const ticketCategoryEnum = z.enum([
  "IT_HARDWARE",
  "IT_SOFTWARE",
  "HR_QUERY",
  "PAYROLL",
  "ACCESS_REQUEST",
  "GENERAL",
]);

export const ticketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const ticketStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  category: ticketCategoryEnum.default("GENERAL"),
  priority: ticketPriorityEnum.default("MEDIUM"),
  description: z.string().min(1, "Description is required"),
  attachments: z.any().optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  status: ticketStatusEnum.optional(),
  assigneeId: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  status: ticketStatusEnum.optional(),
  creatorId: z.string().optional(),
  assigneeId: z.string().optional(),
  scope: z.enum(["my", "admin"]).optional(),
});

export const createTicketCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  isInternalNote: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
