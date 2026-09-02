import { z } from "zod";

// Mirrors backend/src/modules/users/user.schema.ts so both sides share rules.
// Backend remains the final authority; this module drives inline per-field errors.

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
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .optional()
    .or(z.literal("")),
  maritalStatus: z
    .enum(["Single", "Married", "Divorced", "Widowed"])
    .optional()
    .or(z.literal("")),
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
  employmentType: z
    .enum(["Full-time", "Contract", "Internship"])
    .optional()
    .or(z.literal("")),
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
  ctc: z
    .number()
    .min(0, "CTC must be a positive number")
    .or(z.string().transform((v) => Number(v) || 0)),
  probationPeriodMonths: z
    .number()
    .min(0)
    .default(3)
    .or(z.string().transform((v) => Number(v) || 3)),
  noticePeriodDays: z
    .number()
    .min(0)
    .default(30)
    .or(z.string().transform((v) => Number(v) || 30)),
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

export const createFullUserSchema = z.object({
  step1: step1BasicInfoSchema,
  step2: step2PersonalProfileSchema,
  step3: step3PreviousEmploymentSchema,
  step4: step4CurrentEmploymentSchema,
  step5: step5TeamAccessSchema,
  step6: step6ImportantDatesSchema,
  draftId: z.string().optional(),
});

export type Step1Data = z.infer<typeof step1BasicInfoSchema>;
export type Step2Data = z.infer<typeof step2PersonalProfileSchema>;
export type Step3Data = z.infer<typeof step3PreviousEmploymentSchema>;
export type Step4Data = z.infer<typeof step4CurrentEmploymentSchema>;
export type Step5Data = z.infer<typeof step5TeamAccessSchema>;
export type Step6Data = z.infer<typeof step6ImportantDatesSchema>;
export type CreateFullUserData = z.infer<typeof createFullUserSchema>;

/** Maps a zod error path to a flat error key (e.g. `companyName`, `previousEmployments.1.companyName`). */
function toErrorMap(err: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!(key in map)) map[key] = issue.message;
  }
  return map;
}

const STEP_SCHEMAS = {
  1: step1BasicInfoSchema,
  2: step2PersonalProfileSchema,
  3: step3PreviousEmploymentSchema,
  4: step4CurrentEmploymentSchema,
  5: step5TeamAccessSchema,
  6: step6ImportantDatesSchema,
} as const;

export type StepSchemaKey = keyof typeof STEP_SCHEMAS;

export function validateStep(step: StepSchemaKey | number, data: unknown) {
  const schema = STEP_SCHEMAS[step as StepSchemaKey];
  if (!schema) return { ok: true, errors: {} as Record<string, string> };
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, errors: {} as Record<string, string> };
  return { ok: false, errors: toErrorMap(result.error) };
}