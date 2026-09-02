import { z } from "zod";

export const policyCategoryEnum = z.enum([
  "HR",
  "IT",
  "FINANCE",
  "SECURITY",
  "GENERAL",
]);

export const createPolicySchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional().nullable(),
  category: policyCategoryEnum.default("GENERAL"),
  version: z.string().default("1.0"),
  content: z.string().min(1, "Content is required"),
  fileUrl: z.string().optional().nullable(),
  isMandatory: z.boolean().default(false),
  effectiveDate: z.string().optional(),
});

export const updatePolicySchema = z.object({
  title: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  category: policyCategoryEnum.optional(),
  version: z.string().optional(),
  content: z.string().min(1).optional(),
  fileUrl: z.string().optional().nullable(),
  isMandatory: z.boolean().optional(),
  effectiveDate: z.string().optional(),
});

export const policyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: policyCategoryEnum.optional(),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
