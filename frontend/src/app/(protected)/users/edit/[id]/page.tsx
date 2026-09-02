"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api, User } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserWizard } from "../../create/_components";
import { EMPTY_ADDRESS, EMPTY_EMPLOYMENT } from "../../create/_components/types";
import type { WizardFormData, Address, PreviousEmployment } from "../../create/_components/types";

function asAddress(raw: Record<string, unknown> | null | undefined): Address {
  if (!raw) return { ...EMPTY_ADDRESS };
  return {
    line1: String(raw.line1 ?? ""),
    line2: String(raw.line2 ?? ""),
    city: String(raw.city ?? ""),
    state: String(raw.state ?? ""),
    pincode: String(raw.pincode ?? ""),
    country: String(raw.country ?? "India"),
  };
}

function toDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

// "09:30 - 18:30" (or "09:30 AM - 06:30 PM") -> { shiftStart, shiftEnd }
function splitShift(timing?: string | null): { start: string; end: string } {
  if (!timing) return { start: "", end: "" };
  const [start, end] = timing.split("-").map((s) => s.trim());
  return {
    start: start || "",
    end: end || "",
  };
}

export function toWizardFormData(user: User): WizardFormData {
  const profile = user.profile;
  const employment = user.currentEmployment;
  const dates = user.importantDates;
  const shift = splitShift(employment?.shiftTiming);
  const prevEmps: PreviousEmployment[] = (user.previousEmployments ?? []).map((emp) => ({
    companyName: emp.companyName ?? "",
    designation: emp.designation ?? "",
    employmentType: emp.employmentType ?? "Full-time",
    startDate: toDate(emp.startDate),
    endDate: toDate(emp.endDate),
    lastDrawnSalary: emp.lastDrawnSalary ?? 0,
    reasonForLeaving: emp.reasonForLeaving ?? "",
    hrContactName: emp.hrContactName ?? "",
    hrContactPhone: emp.hrContactPhone ?? "",
    hrContactEmail: emp.hrContactEmail ?? "",
    experienceLetterUrl: emp.experienceLetterUrl ?? "",
    relievingLetterUrl: emp.relievingLetterUrl ?? "",
  }));

  const teamIds = (user.teamMembers ?? []).map((t) => t.teamId);
  const primaryTeamId = teamIds[0] ?? "";
  const additionalTeamIds = teamIds.slice(1);
  const roleId = typeof user.role === "string" ? user.role : user.role?.id || "";

  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    officialEmail: user.email ?? "",
    personalEmail: user.personalEmail ?? "",
    mobile: user.mobile ?? "",
    alternateMobile: user.alternateMobile ?? "",
    gender: user.gender ?? "Male",
    roleId,
    departmentId: user.departmentId ?? user.department?.id ?? "",
    employeeId: user.employeeId ?? "",
    avatarUrl: user.avatarUrl ?? "",

    dateOfBirth: toDate(profile?.dateOfBirth),
    bloodGroup: profile?.bloodGroup ?? "A+",
    maritalStatus: profile?.maritalStatus ?? "Single",
    nationality: profile?.nationality ?? "Indian",
    aadhaarNumber: profile?.aadhaarNumber ?? "",
    panNumber: profile?.panNumber ?? "",
    currentAddress: asAddress((profile?.currentAddress ?? null) as Record<string, unknown> | null),
    permanentAddress: asAddress((profile?.permanentAddress ?? null) as Record<string, unknown> | null),
    sameAsCurrentAddress: profile?.sameAsCurrentAddress ?? false,
    emergencyContactName: profile?.emergencyContactName ?? "",
    emergencyContactRelation: profile?.emergencyContactRelation ?? "",
    emergencyContactPhone: profile?.emergencyContactPhone ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",

    previousEmployments: prevEmps.length > 0 ? prevEmps : [{ ...EMPTY_EMPLOYMENT }],

    designation: employment?.designation ?? user.designation ?? "",
    employmentType: employment?.employmentType ?? "Full-time",
    workMode: employment?.workMode ?? "Office",
    workLocation: employment?.workLocation ?? "",
    ctc: employment?.ctc ?? 0,
    probationPeriodMonths: employment?.probationPeriodMonths ?? 3,
    noticePeriodDays: employment?.noticePeriodDays ?? 30,
    shiftStart: shift.start,
    shiftEnd: shift.end,
    skills: employment?.skills ?? [],
    about: employment?.about ?? "",

    primaryTeamId,
    additionalTeamIds,
    reportingManagerId: employment?.reportingManagerId ?? "",
    projectManagerId: employment?.projectManagerId ?? "",
    isSpecialRole: user.isSpecialRole ?? false,
    specialRoleName: user.specialRoleName ?? "",

    interviewDate: toDate(dates?.interviewDate),
    offerDate: toDate(dates?.offerDate),
    joiningDate: toDate(dates?.joiningDate) || new Date().toISOString().split("T")[0],
    probationEndDate: toDate(dates?.probationEndDate),
    confirmationDate: toDate(dates?.confirmationDate),
    resignDate: toDate(dates?.resignDate),
    lastWorkingDay: toDate(dates?.lastWorkingDay),
    fullAndFinalDate: toDate(dates?.fullAndFinalDate),
    finalConfirmationCheckbox: false,
  };
}

export default function EditUserWizardPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<WizardFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getUser(id);
      setInitialData(toWizardFormData(res.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <Card className="mx-auto max-w-5xl border border-border-base bg-surface p-6">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <h2 className="font-heading text-lg font-bold text-text-primary">Unable to load user</h2>
          <p className="text-xs text-text-tertiary">{error ?? "User not found"}</p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-2 rounded-md border border-border-base px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-subtle"
          >
            Go back
          </button>
        </div>
      </Card>
    );
  }

  return <UserWizard mode="edit" userId={id} initialData={initialData} />;
}
