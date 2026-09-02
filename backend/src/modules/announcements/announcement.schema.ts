import { z } from "zod";

export const announcementCategoryEnum = z.enum([
  "GENERAL",
  "HR",
  "EVENTS",
  "IT_INFRA",
  "URGENT",
]);

export const announcementStatusEnum = z.enum(["ACTIVE", "EXPIRED", "DRAFT"]);

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: announcementCategoryEnum.default("GENERAL"),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  isPinned: z.boolean().default(false),
  status: announcementStatusEnum.default("ACTIVE"),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: announcementCategoryEnum.optional(),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).optional(),
  isPinned: z.boolean().optional(),
  status: announcementStatusEnum.optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
});

export const announcementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: announcementCategoryEnum.optional(),
  status: announcementStatusEnum.optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
