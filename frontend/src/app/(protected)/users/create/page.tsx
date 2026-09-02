"use client";

import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { api, Role, Department, Team, User, UserDraft } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { validateStep } from "@/lib/validation/user-wizard";
import {
  WizardStepper,
  WizardHeader,
  WizardFooter,
  SuccessScreen,
  BasicInfoStep,
  ProfileAddressStep,
  PreviousEmploymentStep,
  CurrentEmploymentStep,
  TeamAccessStep,
  ReviewStep,
} from "./_components";
import { stepVariants } from "./_components/motion";
import {
  STEPS,
  EMPTY_ADDRESS,
  EMPTY_EMPLOYMENT,
} from "./_components/types";
import type {
  WizardFormData,
  WizardLookups,
  WizardErrors,
} from "./_components/types";

export default function CreateUserWizardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("draftId"));
  const [autoSaving, setAutoSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  // Lookups data
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [myDrafts, setMyDrafts] = useState<UserDraft[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const lookups: WizardLookups = useMemo(
    () => ({ roles, departments, teams, managers }),
    [roles, departments, teams, managers]
  );

  // Wizard State Object across all 6 steps
  const [formData, setFormData] = useState<WizardFormData>({
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
    currentAddress: { ...EMPTY_ADDRESS },
    permanentAddress: { ...EMPTY_ADDRESS },
    sameAsCurrentAddress: false,
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    linkedinUrl: "",
    portfolioUrl: "",

    // Step 3
    previousEmployments: [{ ...EMPTY_EMPLOYMENT }],

    // Step 4
    designation: "",
    employmentType: "Full-time",
    workMode: "Office",
    workLocation: "Ahmedabad HQ",
    ctc: 600000,
    probationPeriodMonths: 3,
    noticePeriodDays: 30,
      shiftStart: "09:30",
      shiftEnd: "18:30",
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

  // Generic patch updater that also clears touched field errors
  const update = useCallback((patch: Partial<WizardFormData>) => {
    setFormData((f) => ({ ...f, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) {
        delete next[key];
        const nested = Object.keys(next).filter((k) => k.startsWith(`${key}.`) || k.startsWith(`${key}[`));
        nested.forEach((k) => delete next[k]);
      }
      return next;
    });
  }, []);

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
    } catch {
      toast.error("Failed to load organization dropdowns");
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // Load the caller's saved drafts for the "Load Draft" picker
  const loadMyDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await api.listUserDrafts();
      setMyDrafts(res.data || []);
    } catch {
      setMyDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

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
    async (step: number = currentStep) => {
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
      } catch {
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

  // Auto-calculated Probation End Date (Step 6) — joining + probation months
  const autoProbationEndDate = useMemo(() => {
    if (!formData.joiningDate) return "";
    const jDate = new Date(formData.joiningDate);
    if (isNaN(jDate.getTime())) return "";
    jDate.setMonth(jDate.getMonth() + (Number(formData.probationPeriodMonths) || 3));
    return jDate.toISOString().split("T")[0];
  }, [formData.joiningDate, formData.probationPeriodMonths]);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  function handleNext() {
    const result = validateStep(currentStep, formData);
    if (!result.ok) {
      setErrors(result.errors);
      const firstError = Object.values(result.errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }
    setErrors({});
    saveDraft(currentStep + 1);
    goTo(Math.min(STEPS.length, currentStep + 1));
  }

  function handlePrev() {
    goTo(Math.max(1, currentStep - 1));
  }

  function updateEmployment(
    index: number,
    patch: Partial<WizardFormData["previousEmployments"][number]>
  ) {
    setFormData((f) => ({
      ...f,
      previousEmployments: f.previousEmployments.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      const prefix = `previousEmployments.${index}.`;
      Object.keys(next)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => delete next[k]);
      return next;
    });
  }

  function removeEmployment(index: number) {
    setFormData((f) => ({
      ...f,
      previousEmployments: f.previousEmployments.filter((_, i) => i !== index),
    }));
  }

  // Final Step 6 Submit Function
  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateStep(6, formData);
    if (!result.ok) {
      setErrors(result.errors);
      const firstError = Object.values(result.errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }

    setSubmitting(true);
    setErrors({});
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
          shiftTiming: formData.shiftStart && formData.shiftEnd
            ? `${formData.shiftStart} - ${formData.shiftEnd}`
            : "",
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
          probationEndDate: autoProbationEndDate || formData.probationEndDate,
          confirmationDate: formData.confirmationDate,
          resignDate: formData.resignDate,
          lastWorkingDay: formData.lastWorkingDay,
          fullAndFinalDate: formData.fullAndFinalDate,
          finalConfirmationCheckbox: formData.finalConfirmationCheckbox,
        },
      };

      const res = await api.createFullUser(payload);
      if (draftId) api.deleteUserDraft(draftId).catch(() => undefined);
      setCreatedEmail(res.data?.email || formData.officialEmail);
      toast.success("Employee account created successfully! Credentials sent via email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setDraftId(null);
    setCurrentStep(1);
    setErrors({});
    setCreatedEmail(null);
    setFormData({
      firstName: "",
      lastName: "",
      officialEmail: "",
      personalEmail: "",
      mobile: "",
      alternateMobile: "",
      gender: "Male",
      roleId: roles[0]?.id || "",
      departmentId: departments[0]?.id || "",
      employeeId: "",
      avatarUrl: "",
      dateOfBirth: "",
      bloodGroup: "A+",
      maritalStatus: "Single",
      nationality: "Indian",
      aadhaarNumber: "",
      panNumber: "",
      currentAddress: { ...EMPTY_ADDRESS },
      permanentAddress: { ...EMPTY_ADDRESS },
      sameAsCurrentAddress: false,
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      linkedinUrl: "",
      portfolioUrl: "",
      previousEmployments: [{ ...EMPTY_EMPLOYMENT }],
      designation: "",
      employmentType: "Full-time",
      workMode: "Office",
      workLocation: "Ahmedabad HQ",
      ctc: 600000,
      probationPeriodMonths: 3,
      noticePeriodDays: 30,
      shiftStart: "09:30",
      shiftEnd: "18:30",
      skills: [],
      about: "",
      primaryTeamId: teams[0]?.id || "",
      additionalTeamIds: [],
      reportingManagerId: managers[0]?.id || "",
      projectManagerId: "",
      isSpecialRole: false,
      specialRoleName: "",
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
  }

  if (createdEmail) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <WizardHeader
          autoSaving={false}
          draftId={null}
          saving={false}
          onSaveDraft={() => undefined}
        />
        <Card className="border border-border-base bg-surface p-4 shadow-2xs sm:p-6">
          <SuccessScreen email={createdEmail} onReset={handleReset} />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <WizardHeader
        autoSaving={autoSaving}
        draftId={draftId}
        saving={submitting}
        onSaveDraft={() => saveDraft().then(() => toast.success("Draft saved successfully"))}
      />

      <WizardStepper currentStep={currentStep} onStepClick={goTo} />

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            if (!draftsOpen) loadMyDrafts();
            setDraftsOpen((o) => !o);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-base bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:border-brand/40 hover:text-text-primary"
        >
          <FileText className="h-3 w-3 text-brand" /> Load a saved draft
        </button>
      </div>

      <AnimatePresence>
        {draftsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 rounded-lg border border-border-base bg-surface-subtle/30 p-2">
              {loadingDrafts ? (
                <Skeleton className="h-6 w-full" />
              ) : myDrafts.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-text-tertiary">No saved drafts found.</p>
              ) : (
                myDrafts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-border-base bg-surface px-3 py-1.5 text-left text-[11px] text-text-primary transition-colors hover:border-brand/40"
                    onClick={() => router.push(`/users/create?draftId=${d.id}`)}
                  >
                    <span className="truncate">{d.officialEmail || "Untitled draft"}</span>
                    <span className="shrink-0 pl-3 text-text-tertiary">
                      step {d.currentStep} · {new Date(d.updatedAt).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border border-border-base bg-surface p-4 shadow-2xs sm:p-6">
        {loadingLookups ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={currentStep === STEPS.length ? handleFinalSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {currentStep === 1 && (
                  <BasicInfoStep formData={formData} lookups={lookups} errors={errors} update={update} />
                )}
                {currentStep === 2 && (
                  <ProfileAddressStep formData={formData} errors={errors} update={update} />
                )}
                {currentStep === 3 && (
                  <PreviousEmploymentStep
                    formData={formData}
                    errors={errors}
                    totalExperienceYears={totalExperienceYears}
                    update={update}
                    updateEmployment={updateEmployment}
                    removeEmployment={removeEmployment}
                  />
                )}
                {currentStep === 4 && (
                  <CurrentEmploymentStep formData={formData} errors={errors} update={update} />
                )}
                {currentStep === 5 && (
                  <TeamAccessStep formData={formData} lookups={lookups} errors={errors} update={update} />
                )}
                {currentStep === 6 && (
                  <ReviewStep
                    formData={formData}
                    lookups={lookups}
                    errors={errors}
                    update={update}
                    autoProbationEndDate={autoProbationEndDate}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <WizardFooter
              currentStep={currentStep}
              submitting={submitting}
              finalConfirmed={formData.finalConfirmationCheckbox}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </form>
        )}
      </Card>
    </div>
  );
}