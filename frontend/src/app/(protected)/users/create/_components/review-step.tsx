import { motion } from "framer-motion";
import { CalendarClock, UserCheck, Mail, ShieldCheck, BadgeCheck, Baby } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFileUrl } from "@/lib/api";
import { Field } from "./field-error";
import type { WizardFormData, WizardLookups, WizardErrors } from "./types";

interface ReviewStepProps {
  formData: WizardFormData;
  lookups: WizardLookups;
  errors: WizardErrors;
  update: (patch: Partial<WizardFormData>) => void;
  autoProbationEndDate?: string;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-base/50 pb-1.5 last:border-0">
      <span className="text-[11px] text-text-tertiary">{label}</span>
      <span className="text-right text-[11px] font-medium text-text-primary">{value || "—"}</span>
    </div>
  );
}

export function ReviewStep({ formData, lookups, errors, update, autoProbationEndDate }: ReviewStepProps) {
  const role = lookups.roles.find((r) => r.id === formData.roleId);
  const dept = lookups.departments.find((d) => d.id === formData.departmentId);
  const primaryTeam = lookups.teams.find((t) => t.id === formData.primaryTeamId);
  const reportingManager = lookups.managers.find((m) => m.id === formData.reportingManagerId);

  return (
    <motion.div initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h3 className="font-heading text-base font-bold text-text-primary">Step 6: Important Dates & Final Review</h3>
        <p className="text-xs text-text-tertiary">Confirm lifecycle dates, review the summary, and dispatch the account.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Joining Date" required error={errors.joiningDate}>
          <Input type="date" className="h-9 font-semibold" value={formData.joiningDate} onChange={(e) => update({ joiningDate: e.target.value })} />
        </Field>
        <Field label="Probation End Date (auto)">
          <Input type="date" className="h-9 font-mono" value={autoProbationEndDate ?? formData.probationEndDate} onChange={(e) => update({ probationEndDate: e.target.value })} />
        </Field>
        <Field label="Offer Letter Date">
          <Input type="date" className="h-9" value={formData.offerDate} onChange={(e) => update({ offerDate: e.target.value })} />
        </Field>
        <Field label="Interview Date">
          <Input type="date" className="h-9" value={formData.interviewDate} onChange={(e) => update({ interviewDate: e.target.value })} />
        </Field>
        <Field label="Confirmation Date">
          <Input type="date" className="h-9" value={formData.confirmationDate} onChange={(e) => update({ confirmationDate: e.target.value })} />
        </Field>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border-base bg-surface-subtle/30 p-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-text-primary">
              <UserCheck className="h-3.5 w-3.5 text-brand" /> 1. Basic Identity
            </h4>
            {formData.avatarUrl && (
              <Avatar className="h-9 w-9 border border-border-base shadow-2xs">
                <AvatarImage src={apiFileUrl(formData.avatarUrl)} className="object-cover" />
                <AvatarFallback className="text-xs bg-brand/10 text-brand font-bold font-mono">
                  {formData.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <ReviewRow label="Name" value={`${formData.firstName} ${formData.lastName}`} />
          <ReviewRow label="Official Email" value={formData.officialEmail} />
          <ReviewRow label="Mobile" value={formData.mobile} />
          <ReviewRow label="Employee ID" value={formData.employeeId || "Auto-generated"} />
        </div>

        <div className="space-y-1.5 rounded-lg border border-border-base bg-surface-subtle/30 p-3">
          <h4 className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-text-primary">
            <BadgeCheck className="h-3.5 w-3.5 text-brand" /> 2. Role & Department
          </h4>
          <ReviewRow label="Role" value={role?.displayName} />
          <ReviewRow label="Department" value={dept?.name} />
          <ReviewRow label="Designation" value={formData.designation} />
          <ReviewRow label="CTC (Annual)" value={formData.ctc ? `₹${Number(formData.ctc).toLocaleString()}` : "—"} />
        </div>

        <div className="space-y-1.5 rounded-lg border border-border-base bg-surface-subtle/30 p-3">
          <h4 className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-text-primary">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> 3. Team & Reporting
          </h4>
          <ReviewRow label="Primary Team" value={primaryTeam?.name} />
          <ReviewRow
            label="Additional Teams"
            value={
              formData.additionalTeamIds.length
                ? formData.additionalTeamIds.map((id) => lookups.teams.find((t) => t.id === id)?.name).filter(Boolean).join(", ")
                : "None"
            }
          />
          <ReviewRow label="Reporting Manager" value={reportingManager ? `${reportingManager.firstName} ${reportingManager.lastName}` : "—"} />
          <ReviewRow label="Work Mode" value={formData.workMode} />
        </div>

        <div className="space-y-1.5 rounded-lg border border-border-base bg-surface-subtle/30 p-3">
          <h4 className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-text-primary">
            <CalendarClock className="h-3.5 w-3.5 text-brand" /> 4. Dates & Dispatch
          </h4>
          <ReviewRow label="Joining" value={formData.joiningDate} />
          <ReviewRow label="Offer Date" value={formData.offerDate} />
          <ReviewRow label="Probation End" value={autoProbationEndDate || formData.probationEndDate} />
          <ReviewRow label="Email Dispatch" value={<span className="flex items-center justify-end gap-1"><Mail className="h-3 w-3 text-brand" /> Credentials</span>} />
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-start gap-1.5 text-[11px] text-text-tertiary">
        <Baby className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        On submit, the backend creates the account, generates temporary credentials, and emails them to the employee.
      </motion.div>

      <motion.div variants={item} className="flex items-start gap-3 rounded-lg border border-brand/30 bg-surface-container p-3.5">
        <label className="flex flex-1 cursor-pointer select-none items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded-xs border-border-base text-brand focus:ring-brand"
            checked={formData.finalConfirmationCheckbox}
            onChange={(e) => update({ finalConfirmationCheckbox: e.target.checked })}
          />
          <span>
            <span className="block font-heading text-xs font-bold text-text-primary">Final Confirmation & Account Dispatch Authorization *</span>
            <span className="mt-0.5 block text-xs text-text-secondary leading-relaxed">
              I confirm that all 6 steps have been reviewed and verified. Upon clicking &quot;Create Employee&quot;, the user account will be activated, temporary credentials generated, and a welcome email dispatched to{" "}
              <strong className="text-brand">{formData.officialEmail}</strong>.
            </span>
          </span>
        </label>
        {errors.finalConfirmationCheckbox ? (
          <p className="flex-1 text-[11px] text-error">{errors.finalConfirmationCheckbox}</p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}