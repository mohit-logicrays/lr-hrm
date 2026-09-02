import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.string().min(1, "Type is required"),
  referenceId: z.string().optional(),
  link: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updatePreferencesSchema = z.object({
  emailLeaves: z.boolean().optional(),
  emailTimesheet: z.boolean().optional(),
  emailProjects: z.boolean().optional(),
  emailSupport: z.boolean().optional(),
  pushLeaves: z.boolean().optional(),
  pushTimesheet: z.boolean().optional(),
  pushProjects: z.boolean().optional(),
  pushSupport: z.boolean().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export const pushSubscribeSchema = z.object({
  subscription: z.record(z.any()),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
