import { motion } from "framer-motion";
import { Briefcase, Plus, Trash2, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./field-error";
import { FileUploadField } from "./file-upload-field";
import { selectClass } from "./step-common";
import { EMPTY_EMPLOYMENT } from "./types";
import type { WizardFormData, WizardErrors } from "./types";

interface PreviousEmploymentStepProps {
  formData: WizardFormData;
  errors: WizardErrors;
  totalExperienceYears: string;
  update: (patch: Partial<WizardFormData>) => void;
  updateEmployment: (index: number, patch: Partial<WizardFormData["previousEmployments"][number]>) => void;
  removeEmployment: (index: number) => void;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function PreviousEmploymentStep({
  formData,
  errors,
  totalExperienceYears,
  update,
  updateEmployment,
  removeEmployment,
}: PreviousEmploymentStepProps) {
  const employments = formData.previousEmployments;

  return (
    <motion.div initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-2 border-b border-border-base pb-2">
        <div>
          <h3 className="font-heading text-base font-bold text-text-primary">Step 3: Previous Employment</h3>
          <p className="text-xs text-text-tertiary">Add career history, HR references, and experience/relieving letters.</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs font-bold">
          Total Experience: {totalExperienceYears} Years
        </Badge>
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        {employments.map((emp, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border-base bg-surface-subtle/30 p-3.5 shadow-2xs"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-heading text-xs font-bold text-text-primary">
                <Briefcase className="h-3.5 w-3.5 text-brand" /> Company #0{idx + 1}
              </span>
              {employments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmployment(idx)}
                  className="h-6 gap-1 px-2 text-xs text-error hover:bg-error/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Company Name" required error={errors[`previousEmployments.${idx}.companyName`]}>
                <Input
                  className="h-8"
                  placeholder="Company Name"
                  value={emp.companyName}
                  onChange={(e) => updateEmployment(idx, { companyName: e.target.value })}
                />
              </Field>
              <Field label="Designation">
                <Input
                  className="h-8"
                  placeholder="Designation"
                  value={emp.designation}
                  onChange={(e) => updateEmployment(idx, { designation: e.target.value })}
                />
              </Field>
              <Field label="Employment Type">
                <select
                  className={selectClass}
                  value={emp.employmentType}
                  onChange={(e) => updateEmployment(idx, { employmentType: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </Field>

              <Field label="Start Date">
                <Input type="date" className="h-8" value={emp.startDate} onChange={(e) => updateEmployment(idx, { startDate: e.target.value })} />
              </Field>
              <Field label="End Date">
                <Input type="date" className="h-8" value={emp.endDate} onChange={(e) => updateEmployment(idx, { endDate: e.target.value })} />
              </Field>
              <Field label="Last Drawn Annual CTC">
                <Input
                  type="number"
                  className="h-8 font-mono"
                  placeholder="e.g. 450000"
                  value={emp.lastDrawnSalary}
                  onChange={(e) => updateEmployment(idx, { lastDrawnSalary: Number(e.target.value) || 0 })}
                />
              </Field>

              <Field label="Reason for Leaving" className="sm:col-span-3">
                <Input
                  type="text"
                  className="h-8"
                  placeholder="Reason for leaving (optional)"
                  value={emp.reasonForLeaving}
                  onChange={(e) => updateEmployment(idx, { reasonForLeaving: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-border-base/60 pt-3 sm:flex-row sm:items-center">
              <span className="w-40 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Documents</span>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <FileUploadField
                  className="flex-1"
                  value={emp.experienceLetterUrl}
                  onChange={(url) => updateEmployment(idx, { experienceLetterUrl: url })}
                  folder="experience-letters"
                  label="Upload Experience Letter"
                />
                <FileUploadField
                  className="flex-1"
                  value={emp.relievingLetterUrl}
                  onChange={(url) => updateEmployment(idx, { relievingLetterUrl: url })}
                  folder="relieving-letters"
                  label="Upload Relieving Letter"
                />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => update({ previousEmployments: [...employments, { ...EMPTY_EMPLOYMENT }] })}
        >
          <Plus className="h-3.5 w-3.5" /> Add Another Previous Company
        </Button>
        <p className="flex items-center gap-1 text-[11px] text-text-tertiary">
          <CircleAlert className="h-3.5 w-3.5" /> At least one entry with a company name is required by the backend.
        </p>
      </motion.div>
    </motion.div>
  );
}