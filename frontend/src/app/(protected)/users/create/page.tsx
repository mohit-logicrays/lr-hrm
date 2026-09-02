"use client";

import { useCallback, useEffect, useState, FormEvent, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, Department, Role, Team, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Building2,
  Plus,
  Save,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UsersRound,
  Calendar,
  Clock,
  Sparkles,
  Briefcase,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Wizard Steps Meta
const STEPS = [
  { id: 1, label: "Basic Info", desc: "Identity & Credentials" },
  { id: 2, label: "Profile & Address", desc: "Personal & Contacts" },
  { id: 3, label: "Previous Employment", desc: "Career History & Documents" },
  { id: 4, label: "Current Employment", desc: "Role, CTC & Work Mode" },
  { id: 5, label: "Team & Access", desc: "Reporting & RBAC" },
  { id: 6, label: "Review & Confirm", desc: "Dates & Final Dispatch" },
];

export default function CreateUserWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const perms = usePermission("user");

  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("draftId"));
  const [autoSaving, setAutoSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Lookups data
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);

  // Wizard State Object across all 6 steps
  const [formData, setFormData] = useState({
    // Step 1
    firstName: "",
    lastName: "",
    officialEmail: "",
    personalEmail: "",
    mobile: "",
    alternateMobile: "",
    gender: "Male",
    roleId: "",
    departmentId: "",
    employeeId: "",
    avatarUrl: "",

    // Step 2
    dateOfBirth: "",
    bloodGroup: "A+",
    maritalStatus: "Single",
    nationality: "Indian",
    aadhaarNumber: "",
    panNumber: "",
    currentAddress: { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" },
    permanentAddress: { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" },
    sameAsCurrentAddress: false,
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    linkedinUrl: "",
    portfolioUrl: "",

    // Step 3
    previousEmployments: [
      {
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
      },
    ],

    // Step 4
    designation: "",
    employmentType: "Full-time",
    workMode: "Office",
    workLocation: "Ahmedabad HQ",
    ctc: 600000,
    probationPeriodMonths: 3,
    noticePeriodDays: 30,
    shiftTiming: "09:30 AM - 06:30 PM",
    skills: ["React", "TypeScript", "Node.js"],
    about: "",

    // Step 5
    primaryTeamId: "",
    additionalTeamIds: [] as string[],
    reportingManagerId: "",
    projectManagerId: "",
    isSpecialRole: false,
    specialRoleName: "",

    // Step 6
    interviewDate: "",
    offerDate: "",
    joiningDate: new Date().toISOString().split("T")[0],
    probationEndDate: "",
    confirmationDate: "",
    resignDate: "",
    lastWorkingDay: "",
    fullAndFinalDate: "",
    finalConfirmationCheckbox: false,
  });

  // Load Dropdowns (Roles, Departments, Teams, Managers)
  const loadLookups = useCallback(async () => {
    try {
      const [rRes, dRes, tRes, uRes] = await Promise.all([
        api.listRoles(),
        api.listDepartments(1, 100),
        api.listTeams(1, 100),
        api.listUsers(1, 100),
      ]);
      setRoles(rRes.data);
      setDepartments(dRes.data);
      setTeams(tRes.data);
      setManagers(uRes.data);

      // Pre-select defaults if empty
      setFormData((f) => ({
        ...f,
        roleId: f.roleId || rRes.data[0]?.id || "",
        departmentId: f.departmentId || dRes.data[0]?.id || "",
        primaryTeamId: f.primaryTeamId || tRes.data[0]?.id || "",
        reportingManagerId: f.reportingManagerId || uRes.data[0]?.id || "",
      }));
    } catch (err) {
      toast.error("Failed to load organization dropdowns");
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // Load existing draft if draftId provided
  useEffect(() => {
    if (draftId) {
      api
        .getUserDraft(draftId)
        .then((res) => {
          if (res.data.stepData) {
            setFormData((prev) => ({ ...prev, ...res.data.stepData }));
            setCurrentStep(res.data.currentStep || 1);
            toast.success("Loaded saved draft wizard data");
          }
        })
        .catch(() => {
          toast.error("Draft expired or not found");
          setDraftId(null);
        });
    }
  }, [draftId]);

  // Auto-Save Draft Function
  const saveDraft = useCallback(
    async (step = currentStep) => {
      setAutoSaving(true);
      try {
        const res = await api.saveUserDraft({
          draftId: draftId || undefined,
          officialEmail: formData.officialEmail,
          currentStep: step,
          stepData: formData,
        });
        if (res.data.id && !draftId) {
          setDraftId(res.data.id);
        }
        return res.data.id;
      } catch (err) {
        // Silent background fallback
      } finally {
        setAutoSaving(false);
      }
    },
    [currentStep, draftId, formData]
  );

  // Auto-save timer every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData.officialEmail || formData.firstName) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [formData, saveDraft]);

  // Calculate Total Experience Years (Step 3)
  const totalExperienceYears = useMemo(() => {
    let totalDays = 0;
    formData.previousEmployments.forEach((emp) => {
      if (emp.startDate && emp.endDate) {
        const start = new Date(emp.startDate).getTime();
        const end = new Date(emp.endDate).getTime();
        if (end > start) {
          totalDays += (end - start) / (1000 * 60 * 60 * 24);
        }
      }
    });
    return (totalDays / 365.25).toFixed(1);
  }, [formData.previousEmployments]);

  // Auto Probation End Date (Step 6)
  useEffect(() => {
    if (formData.joiningDate) {
      const jDate = new Date(formData.joiningDate);
      if (!isNaN(jDate.getTime())) {
        jDate.setMonth(jDate.getMonth() + (Number(formData.probationPeriodMonths) || 3));
        setFormData((f) => ({
          ...f,
          probationEndDate: jDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [formData.joiningDate, formData.probationPeriodMonths]);

  // Step Validation Logic
  function validateStep(step: number): boolean {
    if (step === 1) {
      if (!formData.firstName.trim()) {
        toast.error("First Name is required");
        return false;
      }
      if (!formData.lastName.trim()) {
        toast.error("Last Name is required");
        return false;
      }
      if (!formData.officialEmail.trim() || !formData.officialEmail.includes("@")) {
        toast.error("Valid Official Email is required");
        return false;
      }
      if (!formData.mobile.trim()) {
        toast.error("Mobile phone number is required");
        return false;
      }
      if (!formData.roleId) {
        toast.error("Role assignment is required");
        return false;
      }
      if (!formData.departmentId) {
        toast.error("Department assignment is required");
        return false;
      }
    }

    if (step === 4) {
      if (!formData.designation.trim()) {
        toast.error("Designation is required");
        return false;
      }
      if (!formData.ctc || Number(formData.ctc) <= 0) {
        toast.error("CTC must be greater than 0");
        return false;
      }
    }

    if (step === 5) {
      if (!formData.primaryTeamId) {
        toast.error("Primary Team assignment is required");
        return false;
      }
      if (!formData.reportingManagerId) {
        toast.error("Reporting Manager assignment is required");
        return false;
      }
    }

    if (step === 6) {
      if (!formData.joiningDate) {
        toast.error("Joining Date is required");
        return false;
      }
      if (!formData.finalConfirmationCheckbox) {
        toast.error("You must check the final confirmation checkbox before creating employee");
        return false;
      }
    }

    return true;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    saveDraft(currentStep + 1);
    setCurrentStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrev() {
    setCurrentStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Final Step 6 Submit Function
  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(6)) return;

    setSubmitting(true);
    try {
      const payload = {
        draftId: draftId || undefined,
        step1: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          officialEmail: formData.officialEmail,
          personalEmail: formData.personalEmail,
          mobile: formData.mobile,
          alternateMobile: formData.alternateMobile,
          gender: formData.gender,
          roleId: formData.roleId,
          departmentId: formData.departmentId,
          employeeId: formData.employeeId,
          avatarUrl: formData.avatarUrl,
        },
        step2: {
          dateOfBirth: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          nationality: formData.nationality,
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
          sameAsCurrentAddress: formData.sameAsCurrentAddress,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactRelation: formData.emergencyContactRelation,
          emergencyContactPhone: formData.emergencyContactPhone,
          linkedinUrl: formData.linkedinUrl,
          portfolioUrl: formData.portfolioUrl,
        },
        step3: {
          previousEmployments: formData.previousEmployments,
          totalExperienceYears: Number(totalExperienceYears),
        },
        step4: {
          designation: formData.designation,
          employmentType: formData.employmentType,
          workMode: formData.workMode,
          workLocation: formData.workLocation,
          ctc: Number(formData.ctc),
          probationPeriodMonths: Number(formData.probationPeriodMonths),
          noticePeriodDays: Number(formData.noticePeriodDays),
          shiftTiming: formData.shiftTiming,
          skills: formData.skills,
          about: formData.about,
        },
        step5: {
          primaryTeamId: formData.primaryTeamId,
          additionalTeamIds: formData.additionalTeamIds,
          reportingManagerId: formData.reportingManagerId,
          projectManagerId: formData.projectManagerId,
          roleId: formData.roleId,
          isSpecialRole: formData.isSpecialRole,
          specialRoleName: formData.specialRoleName,
        },
        step6: {
          interviewDate: formData.interviewDate,
          offerDate: formData.offerDate,
          joiningDate: formData.joiningDate,
          probationEndDate: formData.probationEndDate,
          confirmationDate: formData.confirmationDate,
          resignDate: formData.resignDate,
          lastWorkingDay: formData.lastWorkingDay,
          fullAndFinalDate: formData.fullAndFinalDate,
          finalConfirmationCheckbox: formData.finalConfirmationCheckbox,
        },
      };

      const res = await api.createFullUser(payload);
      toast.success("Employee account created successfully! Credentials sent via email.");
      router.push(`/users`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Avatar / Document File Upload
  async function handleFileUpload(file: File, callback: (url: string) => void) {
    try {
      const res = await api.uploadFile(file);
      callback(res.data.url);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-border-base pb-3">
        <div className="flex items-center gap-3">
          <Link href="/users">
            <Button variant="outline" size="icon-sm" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl font-heading flex items-center gap-2">
              User Creation Wizard
              {autoSaving && <span className="text-[10px] text-brand animate-pulse font-mono">Auto-saving draft...</span>}
            </h1>
            <p className="text-xs text-text-tertiary">
              Complete all 6 steps to configure identity, profile, employment, and permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveDraft().then(() => toast.success("Draft saved successfully"))}
            disabled={autoSaving}
            className="gap-1 text-xs h-8"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </Button>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((s) => {
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;

          return (
            <div
              key={s.id}
              onClick={() => {
                if (s.id < currentStep) setCurrentStep(s.id);
              }}
              className={cn(
                "flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer select-none",
                isCurrent
                  ? "bg-brand/10 border-brand/40 text-brand shadow-2xs"
                  : isDone
                  ? "bg-surface-subtle border-border-base text-success hover:border-success/30"
                  : "bg-surface border-border-base text-text-tertiary opacity-70"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 0{s.id}</span>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : isCurrent ? (
                  <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
                ) : null}
              </div>
              <span className="font-semibold text-xs font-heading line-clamp-1">{s.label}</span>
              <span className="text-[9px] text-text-tertiary line-clamp-1">{s.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Wizard Step Body Canvas */}
      <Card className="p-4 sm:p-6 border border-border-base bg-surface shadow-2xs">
        {loadingLookups ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={currentStep === 6 ? handleFinalSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-border-base pb-2">
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Step 1: Basic Information &amp; Account Identity
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Enter primary employee identifiers, role, department, and contact numbers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs font-semibold">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      required
                      placeholder="e.g. Mohit"
                      className="text-xs h-8.5"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs font-semibold">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      required
                      placeholder="e.g. Patel"
                      className="text-xs h-8.5"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="officialEmail" className="text-xs font-semibold">
                      Official Email * (Unique)
                    </Label>
                    <Input
                      id="officialEmail"
                      type="email"
                      required
                      placeholder="mohit.p@logicrays.com"
                      className="text-xs h-8.5"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="personalEmail" className="text-xs font-semibold">
                      Personal Email
                    </Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      placeholder="mohit.personal@gmail.com"
                      className="text-xs h-8.5"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="mobile" className="text-xs font-semibold">
                      Mobile Number *
                    </Label>
                    <Input
                      id="mobile"
                      required
                      placeholder="+91 98765 43210"
                      className="text-xs h-8.5"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="alternateMobile" className="text-xs font-semibold">
                      Alternate Mobile
                    </Label>
                    <Input
                      id="alternateMobile"
                      placeholder="+91 98765 00000"
                      className="text-xs h-8.5"
                      value={formData.alternateMobile}
                      onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs font-semibold">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="employeeId" className="text-xs font-semibold">
                      Employee ID (Leave blank to auto-generate)
                    </Label>
                    <Input
                      id="employeeId"
                      placeholder="e.g. LRT-2026-008"
                      className="text-xs h-8.5 font-mono"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="roleId" className="text-xs font-semibold">
                      Role *
                    </Label>
                    <select
                      id="roleId"
                      required
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.displayName} ({r.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="departmentId" className="text-xs font-semibold">
                      Department *
                    </Label>
                    <select
                      id="departmentId"
                      required
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar Upload */}
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-semibold">Profile Photo / Avatar</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-surface-subtle border border-border-base flex items-center justify-center overflow-hidden shrink-0">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UsersRound className="h-6 w-6 text-text-tertiary" />
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-base bg-surface hover:bg-surface-subtle text-xs font-medium text-text-primary shadow-2xs transition-colors">
                      <Upload className="h-3.5 w-3.5 text-brand" /> Upload Avatar Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) => setFormData((f) => ({ ...f, avatarUrl: url })));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal & Profile Details */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-border-base pb-2">
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Step 2: Personal Profile &amp; Address Details
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Enter government IDs, blood group, addresses, and emergency contacts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="dateOfBirth" className="text-xs font-semibold">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      className="text-xs h-8.5"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bloodGroup" className="text-xs font-semibold">
                      Blood Group
                    </Label>
                    <select
                      id="bloodGroup"
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="maritalStatus" className="text-xs font-semibold">
                      Marital Status
                    </Label>
                    <select
                      id="maritalStatus"
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    >
                      {["Single", "Married", "Divorced", "Widowed"].map((ms) => (
                        <option key={ms} value={ms}>{ms}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nationality" className="text-xs font-semibold">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      className="text-xs h-8.5"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="aadhaarNumber" className="text-xs font-semibold">
                      Aadhaar Card Number
                    </Label>
                    <Input
                      id="aadhaarNumber"
                      placeholder="1234 5678 9012"
                      className="text-xs h-8.5 font-mono"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="panNumber" className="text-xs font-semibold">
                      PAN Card Number
                    </Label>
                    <Input
                      id="panNumber"
                      placeholder="ABCDE1234F"
                      className="text-xs h-8.5 font-mono uppercase"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Current & Permanent Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 p-3 rounded-lg border border-border-base bg-surface-subtle/30">
                    <h4 className="font-semibold text-xs font-heading text-text-primary">Current Address</h4>
                    <Input
                      placeholder="Address Line 1"
                      className="text-xs h-8"
                      value={formData.currentAddress.line1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentAddress: { ...formData.currentAddress, line1: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="Address Line 2"
                      className="text-xs h-8"
                      value={formData.currentAddress.line2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentAddress: { ...formData.currentAddress, line2: e.target.value },
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        className="text-xs h-8"
                        value={formData.currentAddress.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentAddress: { ...formData.currentAddress, city: e.target.value },
                          })
                        }
                      />
                      <Input
                        placeholder="State"
                        className="text-xs h-8"
                        value={formData.currentAddress.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentAddress: { ...formData.currentAddress, state: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-lg border border-border-base bg-surface-subtle/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs font-heading text-text-primary">Permanent Address</h4>
                      <label className="flex items-center gap-1 cursor-pointer text-xs text-brand font-medium select-none">
                        <input
                          type="checkbox"
                          checked={formData.sameAsCurrentAddress}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              sameAsCurrentAddress: e.target.checked,
                              permanentAddress: e.target.checked ? { ...f.currentAddress } : f.permanentAddress,
                            }))
                          }
                          className="rounded-xs border-border-base text-brand focus:ring-brand h-3.5 w-3.5"
                        />
                        Same as Current
                      </label>
                    </div>
                    {!formData.sameAsCurrentAddress ? (
                      <>
                        <Input
                          placeholder="Address Line 1"
                          className="text-xs h-8"
                          value={formData.permanentAddress.line1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permanentAddress: { ...formData.permanentAddress, line1: e.target.value },
                            })
                          }
                        />
                        <Input
                          placeholder="Address Line 2"
                          className="text-xs h-8"
                          value={formData.permanentAddress.line2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permanentAddress: { ...formData.permanentAddress, line2: e.target.value },
                            })
                          }
                        />
                      </>
                    ) : (
                      <p className="text-xs text-text-tertiary italic pt-2">
                        Permanent address copied from current address.
                      </p>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/30 space-y-2">
                  <h4 className="font-semibold text-xs font-heading text-text-primary">Emergency Contact Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Contact Person Name"
                      className="text-xs h-8"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    />
                    <Input
                      placeholder="Relation (e.g. Spouse, Father)"
                      className="text-xs h-8"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    />
                    <Input
                      placeholder="Emergency Phone Number"
                      className="text-xs h-8"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Previous Employment (Multiple Entries) */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border-base pb-2">
                  <div>
                    <h3 className="text-base font-bold text-text-primary font-heading">
                      Step 3: Previous Employment &amp; Work History
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      Add previous employment experience, HR references, and upload experience/relieving letters.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold font-mono">
                    Total Experience: {totalExperienceYears} Years
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.previousEmployments.map((emp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-border-base bg-surface-subtle/30 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-heading text-text-primary flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-brand" /> Company #0{idx + 1}
                        </span>
                        {formData.previousEmployments.length > 1 && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setFormData((f) => ({
                                ...f,
                                previousEmployments: f.previousEmployments.filter((_, i) => i !== idx),
                              }))
                            }
                            className="text-error hover:bg-error/10 h-6 px-2 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="Company Name *"
                          className="text-xs h-8"
                          value={emp.companyName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((f) => ({
                              ...f,
                              previousEmployments: f.previousEmployments.map((item, i) =>
                                i === idx ? { ...item, companyName: val } : item
                              ),
                            }));
                          }}
                        />
                        <Input
                          placeholder="Designation"
                          className="text-xs h-8"
                          value={emp.designation}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((f) => ({
                              ...f,
                              previousEmployments: f.previousEmployments.map((item, i) =>
                                i === idx ? { ...item, designation: val } : item
                              ),
                            }));
                          }}
                        />
                        <select
                          className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs text-text-primary"
                          value={emp.employmentType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((f) => ({
                              ...f,
                              previousEmployments: f.previousEmployments.map((item, i) =>
                                i === idx ? { ...item, employmentType: val } : item
                              ),
                            }));
                          }}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                        </select>

                        <div className="space-y-1">
                          <span className="text-[10px] text-text-tertiary">Start Date</span>
                          <Input
                            type="date"
                            className="text-xs h-8"
                            value={emp.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((f) => ({
                                ...f,
                                previousEmployments: f.previousEmployments.map((item, i) =>
                                  i === idx ? { ...item, startDate: val } : item
                                ),
                              }));
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-text-tertiary">End Date</span>
                          <Input
                            type="date"
                            className="text-xs h-8"
                            value={emp.endDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((f) => ({
                                ...f,
                                previousEmployments: f.previousEmployments.map((item, i) =>
                                  i === idx ? { ...item, endDate: val } : item
                                ),
                              }));
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-text-tertiary">Last Drawn Annual Salary (CTC)</span>
                          <Input
                            type="number"
                            placeholder="e.g. 450000"
                            className="text-xs h-8 font-mono"
                            value={emp.lastDrawnSalary}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setFormData((f) => ({
                                ...f,
                                previousEmployments: f.previousEmployments.map((item, i) =>
                                  i === idx ? { ...item, lastDrawnSalary: val } : item
                                ),
                              }));
                            }}
                          />
                        </div>
                      </div>

                      {/* File Uploads for Experience Letter & Relieving Letter */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border-base/50">
                        <label className="cursor-pointer flex items-center justify-between p-2 rounded border border-border-base bg-surface hover:bg-surface-subtle text-xs">
                          <span className="truncate">
                            {emp.experienceLetterUrl ? "✓ Experience Letter Uploaded" : "Upload Experience Letter (PDF/Img)"}
                          </span>
                          <Upload className="h-3.5 w-3.5 text-brand shrink-0" />
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (url) => {
                                  setFormData((f) => ({
                                    ...f,
                                    previousEmployments: f.previousEmployments.map((item, i) =>
                                      i === idx ? { ...item, experienceLetterUrl: url } : item
                                    ),
                                  }));
                                });
                              }
                            }}
                          />
                        </label>

                        <label className="cursor-pointer flex items-center justify-between p-2 rounded border border-border-base bg-surface hover:bg-surface-subtle text-xs">
                          <span className="truncate">
                            {emp.relievingLetterUrl ? "✓ Relieving Letter Uploaded" : "Upload Relieving Letter (PDF/Img)"}
                          </span>
                          <Upload className="h-3.5 w-3.5 text-brand shrink-0" />
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (url) => {
                                  setFormData((f) => ({
                                    ...f,
                                    previousEmployments: f.previousEmployments.map((item, i) =>
                                      i === idx ? { ...item, relievingLetterUrl: url } : item
                                    ),
                                  }));
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((f) => ({
                        ...f,
                        previousEmployments: [
                          ...f.previousEmployments,
                          {
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
                          },
                        ],
                      }))
                    }
                    className="gap-1 text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Previous Company
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Current Employment Details */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-border-base pb-2">
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Step 4: Current Employment &amp; Compensation Setup
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Set designation, CTC, work mode, probation period, notice period, and technical skills.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="designation" className="text-xs font-semibold">
                      Designation *
                    </Label>
                    <Input
                      id="designation"
                      required
                      placeholder="e.g. Senior Software Engineer"
                      className="text-xs h-8.5"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="employmentType" className="text-xs font-semibold">
                      Employment Type *
                    </Label>
                    <select
                      id="employmentType"
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Intern">Intern</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="workMode" className="text-xs font-semibold">
                      Work Mode
                    </Label>
                    <select
                      id="workMode"
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.workMode}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                    >
                      <option value="Office">Office</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ctc" className="text-xs font-semibold">
                      Annual CTC (INR ₹) *
                    </Label>
                    <Input
                      id="ctc"
                      type="number"
                      required
                      placeholder="600000"
                      className="text-xs h-8.5 font-mono font-bold"
                      value={formData.ctc}
                      onChange={(e) => setFormData({ ...formData, ctc: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="probationPeriodMonths" className="text-xs font-semibold">
                      Probation Period (Months)
                    </Label>
                    <Input
                      id="probationPeriodMonths"
                      type="number"
                      min={0}
                      className="text-xs h-8.5 font-mono"
                      value={formData.probationPeriodMonths}
                      onChange={(e) =>
                        setFormData({ ...formData, probationPeriodMonths: Number(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noticePeriodDays" className="text-xs font-semibold">
                      Notice Period (Days)
                    </Label>
                    <Input
                      id="noticePeriodDays"
                      type="number"
                      min={0}
                      className="text-xs h-8.5 font-mono"
                      value={formData.noticePeriodDays}
                      onChange={(e) =>
                        setFormData({ ...formData, noticePeriodDays: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="about" className="text-xs font-semibold">
                    About / Employee Professional Summary
                  </Label>
                  <textarea
                    id="about"
                    rows={3}
                    placeholder="Brief bio or notes regarding employee qualifications..."
                    className="w-full rounded-md border border-border-base bg-surface p-2 text-xs font-normal text-text-primary shadow-2xs focus:border-brand focus:outline-none min-h-[70px]"
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Team, Reporting & Access */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-border-base pb-2">
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Step 5: Team Assignment &amp; Reporting Hierarchy
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Assign primary team, reporting managers, and confirm access permissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="primaryTeamId" className="text-xs font-semibold">
                      Primary Team *
                    </Label>
                    <select
                      id="primaryTeamId"
                      required
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.primaryTeamId}
                      onChange={(e) => setFormData({ ...formData, primaryTeamId: e.target.value })}
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reportingManagerId" className="text-xs font-semibold">
                      Reporting Manager (Team Lead / Manager) *
                    </Label>
                    <select
                      id="reportingManagerId"
                      required
                      className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                      value={formData.reportingManagerId}
                      onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
                    >
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {`${m.firstName} ${m.lastName}`.trim() || m.email}
                          {m.designation ? ` (${m.designation})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border-base bg-surface-subtle/30 space-y-2">
                  <h4 className="font-semibold text-xs font-heading text-text-primary flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-brand" /> Confirmed Role &amp; Special Access
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Role assigned:{" "}
                    <strong>
                      {roles.find((r) => r.id === formData.roleId)?.displayName || "Role Selected"}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Important Dates & Final Review */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-border-base pb-2">
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Step 6: Important Dates &amp; Final Review Dispatch
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Review all employee details before triggering database account creation and email credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="joiningDate" className="text-xs font-semibold">
                      Joining Date *
                    </Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      required
                      className="text-xs h-8.5 font-semibold"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="probationEndDate" className="text-xs font-semibold">
                      Probation End Date (Auto-calculated)
                    </Label>
                    <Input
                      id="probationEndDate"
                      type="date"
                      className="text-xs h-8.5 font-mono"
                      value={formData.probationEndDate}
                      onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="offerDate" className="text-xs font-semibold">
                      Offer Letter Date
                    </Label>
                    <Input
                      id="offerDate"
                      type="date"
                      className="text-xs h-8.5"
                      value={formData.offerDate}
                      onChange={(e) => setFormData({ ...formData, offerDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Collapsible Section Review Cards */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-text-tertiary">
                    Summary Review
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/40 space-y-1">
                      <span className="font-bold text-text-primary block font-heading">
                        1. Basic Identity
                      </span>
                      <p>
                        Name: {formData.firstName} {formData.lastName}
                      </p>
                      <p>Email: {formData.officialEmail}</p>
                      <p>Mobile: {formData.mobile}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border-base bg-surface-subtle/40 space-y-1">
                      <span className="font-bold text-text-primary block font-heading">
                        2. Current Employment
                      </span>
                      <p>Designation: {formData.designation}</p>
                      <p>CTC: ₹{formData.ctc.toLocaleString()}</p>
                      <p>Work Mode: {formData.workMode}</p>
                    </div>
                  </div>
                </div>

                {/* Final Confirmation Checkbox Requirement */}
                <div className="p-3.5 rounded-lg border border-brand/30 bg-surface-container space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={formData.finalConfirmationCheckbox}
                      onChange={(e) =>
                        setFormData({ ...formData, finalConfirmationCheckbox: e.target.checked })
                      }
                      className="mt-0.5 rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-xs text-text-primary font-heading block">
                        Final Confirmation &amp; Account Dispatch Authorization *
                      </span>
                      <span className="text-xs text-text-secondary leading-relaxed block mt-0.5">
                        I confirm that all 6 steps have been reviewed and verified. Upon clicking "Create Employee", the user account will be activated, temporary credentials generated, and a welcome email dispatched to{" "}
                        <strong className="text-brand">{formData.officialEmail}</strong>.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-6 pt-3 border-t border-border-base flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 1 || submitting}
                className="gap-1 text-xs h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous Step
              </Button>

              {currentStep < 6 ? (
                <Button type="button" size="sm" onClick={handleNext} className="gap-1 text-xs h-8 shadow-2xs">
                  Next Step <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !formData.finalConfirmationCheckbox}
                  className="gap-1.5 text-xs h-8.5 px-4 shadow-md bg-brand hover:bg-brand-hover text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  {submitting ? "Creating & Dispatched..." : "Create Employee & Send Credentials"}
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
