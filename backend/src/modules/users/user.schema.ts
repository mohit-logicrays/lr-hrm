import { z } from "zod";

export const step1BasicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  officialEmail: z.string().email("Invalid official email address"),
  personalEmail: z.string().email("Invalid personal email address").optional().or(z.literal("")),
  mobile: z.string().min(7, "Mobile phone number is required"),
  alternateMobile: z.string().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().min(1, "Department is required"),
  employeeId: z.string().optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
});

export const addressSchema = z.object({
  line1: z.string().optional().or(z.literal("")),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

export const step2PersonalProfileSchema = z.object({
  dateOfBirth: z.string().optional().or(z.literal("")),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional().or(z.literal("")),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  aadhaarNumber: z.string().optional().or(z.literal("")),
  panNumber: z.string().optional().or(z.literal("")),
  currentAddress: addressSchema.optional(),
  permanentAddress: addressSchema.optional(),
  sameAsCurrentAddress: z.boolean().default(false),
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactRelation: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().optional().or(z.literal("")),
  portfolioUrl: z.string().optional().or(z.literal("")),
});

export const previousEmploymentItemSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  designation: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["Full-time", "Contract", "Internship"]).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  lastDrawnSalary: z.number().optional().or(z.string().transform((v) => Number(v) || 0)),
  reasonForLeaving: z.string().optional().or(z.literal("")),
  hrContactName: z.string().optional().or(z.literal("")),
  hrContactPhone: z.string().optional().or(z.literal("")),
  hrContactEmail: z.string().optional().or(z.literal("")),
  experienceLetterUrl: z.string().optional().or(z.literal("")),
  relievingLetterUrl: z.string().optional().or(z.literal("")),
});

export const step3PreviousEmploymentSchema = z.object({
  previousEmployments: z.array(previousEmploymentItemSchema).default([]),
  totalExperienceYears: z.number().default(0),
});

export const step4CurrentEmploymentSchema = z.object({
  designation: z.string().min(1, "Designation is required"),
  employmentType: z.enum(["Full-time", "Intern", "Contract"]).default("Full-time"),
  workMode: z.enum(["Office", "Hybrid", "Remote"]).default("Office"),
  workLocation: z.string().optional().or(z.literal("")),
  ctc: z.number().min(0, "CTC must be a positive number").or(z.string().transform((v) => Number(v) || 0)),
  probationPeriodMonths: z.number().min(0).default(3).or(z.string().transform((v) => Number(v) || 3)),
  noticePeriodDays: z.number().min(0).default(30).or(z.string().transform((v) => Number(v) || 30)),
  shiftTiming: z.string().optional().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  about: z.string().optional().or(z.literal("")),
});

export const step5TeamAccessSchema = z.object({
  primaryTeamId: z.string().min(1, "Primary Team is required"),
  additionalTeamIds: z.array(z.string()).default([]),
  reportingManagerId: z.string().min(1, "Reporting Manager is required"),
  projectManagerId: z.string().optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  isSpecialRole: z.boolean().default(false),
  specialRoleName: z.string().optional().or(z.literal("")),
});

export const step6ImportantDatesSchema = z.object({
  interviewDate: z.string().optional().or(z.literal("")),
  offerDate: z.string().optional().or(z.literal("")),
  joiningDate: z.string().min(1, "Joining date is required"),
  probationEndDate: z.string().optional().or(z.literal("")),
  confirmationDate: z.string().optional().or(z.literal("")),
  resignDate: z.string().optional().or(z.literal("")),
  lastWorkingDay: z.string().optional().or(z.literal("")),
  fullAndFinalDate: z.string().optional().or(z.literal("")),
  finalConfirmationCheckbox: z.boolean().refine((val) => val === true, {
    message: "You must confirm and check the final confirmation before creating user",
  }),
});

// Draft Schema
export const createDraftSchema = z.object({
  draftId: z.string().optional(),
  officialEmail: z.string().optional().or(z.literal("")),
  currentStep: z.number().min(1).max(6).default(1),
  stepData: z.record(z.any()),
});

// Full 6-Step Creation Schema
export const createFullUserSchema = z.object({
  step1: step1BasicInfoSchema,
  step2: step2PersonalProfileSchema,
  step3: step3PreviousEmploymentSchema,
  step4: step4CurrentEmploymentSchema,
  step5: step5TeamAccessSchema,
  step6: step6ImportantDatesSchema,
  draftId: z.string().optional(),
});

// Full 6-Step Update Schema — same shape as creation
export const updateFullUserSchema = z.object({
  step1: step1BasicInfoSchema,
  step2: step2PersonalProfileSchema,
  step3: step3PreviousEmploymentSchema,
  step4: step4CurrentEmploymentSchema,
  step5: step5TeamAccessSchema,
  step6: step6ImportantDatesSchema,
});

// Legacy User Management Schemas
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal("")),
  designation: z.string().optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

export const updateUserSchema = createUserSchema.partial();

export const userQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  search: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PreviousEmploymentItem = z.infer<typeof previousEmploymentItemSchema>;
export type Step3PreviousEmployment = z.infer<typeof step3PreviousEmploymentSchema>;
export type CreateFullUserInput = z.infer<typeof createFullUserSchema>;
export type UpdateFullUserInput = z.infer<typeof updateFullUserSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
