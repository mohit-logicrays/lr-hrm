import { z } from "zod";

export const updateBasicDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  personalEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  mobile: z.string().min(7, "Valid mobile number is required").optional().or(z.literal("")),
  alternateMobile: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
});

export const addressItemSchema = z.object({
  line1: z.string().optional().or(z.literal("")),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

export const updateAddressSchema = z.object({
  currentAddress: addressItemSchema.optional(),
  permanentAddress: addressItemSchema.optional(),
  sameAsCurrentAddress: z.boolean().default(false),
});

export const updateEmergencyContactSchema = z.object({
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactRelation: z.string().min(1, "Relation is required"),
  emergencyContactPhone: z.string().min(7, "Valid phone number is required"),
});

export const updateProfilePictureSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar image URL"),
});

export const changeProfilePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type UpdateBasicDetailsInput = z.infer<typeof updateBasicDetailsSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
export type UpdateProfilePictureInput = z.infer<typeof updateProfilePictureSchema>;
export type ChangeProfilePasswordInput = z.infer<typeof changeProfilePasswordSchema>;
