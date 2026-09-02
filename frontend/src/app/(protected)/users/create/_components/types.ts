import type { Role, Department, Team, User } from "@/lib/api";
import type { LucideIcon } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Basic Info", desc: "Identity & Credentials" },
  { id: 2, label: "Profile & Address", desc: "Personal & Contacts" },
  { id: 3, label: "Previous Employment", desc: "Career History & Documents" },
  { id: 4, label: "Current Employment", desc: "Role, CTC & Work Mode" },
  { id: 5, label: "Team & Access", desc: "Reporting & RBAC" },
  { id: 6, label: "Review & Confirm", desc: "Dates & Final Dispatch" },
] as const;

export interface WizardLookups {
  roles: Role[];
  departments: Department[];
  teams: Team[];
  managers: User[];
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PreviousEmployment {
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  lastDrawnSalary: number;
  reasonForLeaving: string;
  hrContactName: string;
  hrContactPhone: string;
  hrContactEmail: string;
  experienceLetterUrl: string;
  relievingLetterUrl: string;
}

export interface WizardFormData {
  firstName: string;
  lastName: string;
  officialEmail: string;
  personalEmail: string;
  mobile: string;
  alternateMobile: string;
  gender: string;
  roleId: string;
  departmentId: string;
  employeeId: string;
  avatarUrl: string;

  dateOfBirth: string;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  aadhaarNumber: string;
  panNumber: string;
  currentAddress: Address;
  permanentAddress: Address;
  sameAsCurrentAddress: boolean;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  linkedinUrl: string;
  portfolioUrl: string;

  previousEmployments: PreviousEmployment[];

  designation: string;
  employmentType: string;
  workMode: string;
  workLocation: string;
  ctc: number | string;
  probationPeriodMonths: number | string;
  noticePeriodDays: number | string;
  shiftStart: string;
  shiftEnd: string;
  skills: string[];
  about: string;

  primaryTeamId: string;
  additionalTeamIds: string[];
  reportingManagerId: string;
  projectManagerId: string;
  isSpecialRole: boolean;
  specialRoleName: string;

  interviewDate: string;
  offerDate: string;
  joiningDate: string;
  probationEndDate: string;
  confirmationDate: string;
  resignDate: string;
  lastWorkingDay: string;
  fullAndFinalDate: string;
  finalConfirmationCheckbox: boolean;
}

export const EMPTY_EMPLOYMENT: PreviousEmployment = {
  companyName: "",
  designation: "",
  employmentType: "Full-time",
  startDate: "",
  endDate: "",
  lastDrawnSalary: 0,
  reasonForLeaving: "",
  hrContactName: "",
  hrContactPhone: "",
  hrContactEmail: "",
  experienceLetterUrl: "",
  relievingLetterUrl: "",
};

export const EMPTY_ADDRESS: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export interface StepMeta {
  id: number;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export type WizardErrors = Record<string, string>;