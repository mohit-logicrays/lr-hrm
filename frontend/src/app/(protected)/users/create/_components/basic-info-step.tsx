import { motion } from "framer-motion";
import { UserRoundCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "./field-error";
import { FileUploadField } from "./file-upload-field";
import { selectClass } from "./step-common";
import type { WizardFormData, WizardLookups, WizardErrors } from "./types";

interface BasicInfoStepProps {
  formData: WizardFormData;
  lookups: WizardLookups;
  errors: WizardErrors;
  update: (patch: Partial<WizardFormData>) => void;
}

const container = {
  hidden: { opacity: 1 },
  show: { transition: { staggerChildren: 0.03 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function BasicInfoStep({ formData, lookups, errors, update }: BasicInfoStepProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h3 className="font-heading text-base font-bold text-text-primary">Step 1: Basic Information</h3>
        <p className="text-xs text-text-tertiary">Primary identity, role, and credentials setup.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName}>
          <Input
            value={formData.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder="e.g. Mohit"
            className="h-9"
          />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <Input
            value={formData.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
            placeholder="e.g. Patel"
            className="h-9"
          />
        </Field>

        <Field label="Official Email" required error={errors.officialEmail} hint="Credentials will be sent here">
          <Input
            type="email"
            value={formData.officialEmail}
            onChange={(e) => update({ officialEmail: e.target.value })}
            placeholder="mohit.p@logicrays.com"
            className="h-9"
          />
        </Field>
        <Field label="Personal Email" error={errors.personalEmail}>
          <Input
            type="email"
            value={formData.personalEmail}
            onChange={(e) => update({ personalEmail: e.target.value })}
            placeholder="mohit.personal@gmail.com"
            className="h-9"
          />
        </Field>

        <Field label="Mobile Number" required error={errors.mobile}>
          <Input
            value={formData.mobile}
            onChange={(e) => update({ mobile: e.target.value })}
            placeholder="+91 98765 43210"
            className="h-9"
          />
        </Field>
        <Field label="Alternate Mobile" error={errors.alternateMobile}>
          <Input
            value={formData.alternateMobile}
            onChange={(e) => update({ alternateMobile: e.target.value })}
            placeholder="+91 98765 00000"
            className="h-9"
          />
        </Field>

        <Field label="Gender">
          <select className={selectClass} value={formData.gender} onChange={(e) => update({ gender: e.target.value })}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Employee ID" error={errors.employeeId} hint="Leave blank to auto-generate">
          <Input
            value={formData.employeeId}
            onChange={(e) => update({ employeeId: e.target.value })}
            placeholder="e.g. LRT-2026-008"
            className="h-9 font-mono"
          />
        </Field>

        <Field label="Role" required error={errors.roleId}>
          <select className={selectClass} value={formData.roleId} onChange={(e) => update({ roleId: e.target.value })}>
            <option value="">Select role…</option>
            {lookups.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName} ({r.name})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Department" required error={errors.departmentId}>
          <select
            className={selectClass}
            value={formData.departmentId}
            onChange={(e) => update({ departmentId: e.target.value })}
          >
            <option value="">Select department…</option>
            {lookups.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </Field>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center gap-4 rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
          <FileUploadField
            value={formData.avatarUrl}
            onChange={(url) => update({ avatarUrl: url })}
            onClear={() => update({ avatarUrl: "" })}
            preview="image"
            accept="image/*"
            folder="avatars"
            label="Upload profile photo"
          />
          <div className="flex flex-col gap-1 text-xs text-text-secondary">
            <Badge variant="outline" className="w-fit items-center gap-1">
              <UserRoundCog className="h-3 w-3 text-brand" /> Avatar
            </Badge>
            <p className="text-[10px] text-text-tertiary">JPG, PNG, WEBP · up to 10 MB</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}