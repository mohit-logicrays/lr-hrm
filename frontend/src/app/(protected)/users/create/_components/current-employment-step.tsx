import { motion } from "framer-motion";
import { BriefcaseBusiness, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SkillPicker } from "@/components/ui/skill-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Field } from "./field-error";
import { selectClass } from "./step-common";
import type { WizardFormData, WizardErrors } from "./types";

interface CurrentEmploymentStepProps {
  formData: WizardFormData;
  errors: WizardErrors;
  update: (patch: Partial<WizardFormData>) => void;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function CurrentEmploymentStep({ formData, errors, update }: CurrentEmploymentStepProps) {
  return (
    <motion.div initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h3 className="font-heading text-base font-bold text-text-primary">Step 4: Current Employment</h3>
        <p className="text-xs text-text-tertiary">Role, compensation, work mode, and technical skills.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Designation" required error={errors.designation}>
          <Input className="h-9" placeholder="e.g. Senior Software Engineer" value={formData.designation} onChange={(e) => update({ designation: e.target.value })} />
        </Field>
        <Field label="Employment Type">
          <select className={selectClass} value={formData.employmentType} onChange={(e) => update({ employmentType: e.target.value })}>
            <option value="Full-time">Full-time</option>
            <option value="Intern">Intern</option>
            <option value="Contract">Contract</option>
          </select>
        </Field>
        <Field label="Work Mode">
          <select className={selectClass} value={formData.workMode} onChange={(e) => update({ workMode: e.target.value })}>
            <option value="Office">Office</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
        </Field>

        <Field label="Work Location">
          <Input className="h-9" placeholder="e.g. Ahmedabad HQ" value={formData.workLocation} onChange={(e) => update({ workLocation: e.target.value })} />
        </Field>
        <Field label="Annual CTC (INR ₹)" required error={errors.ctc}>
          <Input
            type="number"
            className="h-9 font-mono font-bold"
            placeholder="600000"
            value={formData.ctc}
            onChange={(e) => update({ ctc: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Shift Start Time">
          <Input
            type="time"
            className="h-9 font-mono"
            value={formData.shiftStart}
            onChange={(e) => update({ shiftStart: e.target.value })}
          />
        </Field>
        <Field label="Shift End Time">
          <Input
            type="time"
            className="h-9 font-mono"
            value={formData.shiftEnd}
            onChange={(e) => update({ shiftEnd: e.target.value })}
          />
        </Field>

        <Field label="Probation Period (Months)">
          <Input type="number" min={0} className="h-9 font-mono" value={formData.probationPeriodMonths} onChange={(e) => update({ probationPeriodMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Notice Period (Days)">
          <Input type="number" min={0} className="h-9 font-mono" value={formData.noticePeriodDays} onChange={(e) => update({ noticePeriodDays: Number(e.target.value) || 0 })} />
        </Field>
      </motion.div>

      <motion.div variants={item} className="space-y-2 rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
        <h4 className="flex items-center gap-1.5 font-heading text-xs font-semibold text-text-primary">
          <Wrench className="h-3.5 w-3.5 text-brand" /> Skills & Technologies
        </h4>
        <SkillPicker value={formData.skills} onChange={(skills) => update({ skills })} />
      </motion.div>

      <motion.div variants={item} className="space-y-1">
        <label className="text-xs font-semibold text-text-primary">About / Professional Summary</label>
        <RichTextEditor
          value={formData.about}
          onChange={(html) => update({ about: html })}
          placeholder="Brief bio or notes regarding employee qualifications…"
          className="text-xs"
        />
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
        <BriefcaseBusiness className="h-3.5 w-3.5" /> The backend auto-generates temporary credentials and emails them on creation.
      </motion.div>
    </motion.div>
  );
}