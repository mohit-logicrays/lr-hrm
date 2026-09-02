import { motion } from "framer-motion";
import { ShieldCheck, UsersRound, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field } from "./field-error";
import { Input } from "@/components/ui/input";
import { selectClass } from "./step-common";
import type { WizardFormData, WizardLookups, WizardErrors } from "./types";

interface TeamAccessStepProps {
  formData: WizardFormData;
  lookups: WizardLookups;
  errors: WizardErrors;
  update: (patch: Partial<WizardFormData>) => void;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function TeamAccessStep({ formData, lookups, errors, update }: TeamAccessStepProps) {
  const selectedRole = lookups.roles.find((r) => r.id === formData.roleId);

  return (
    <motion.div initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h3 className="font-heading text-base font-bold text-text-primary">Step 5: Team & Access</h3>
        <p className="text-xs text-text-tertiary">Reporting hierarchy, team membership, and role-based access.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Primary Team" required error={errors.primaryTeamId}>
          <select className={selectClass} value={formData.primaryTeamId} onChange={(e) => update({ primaryTeamId: e.target.value })}>
            <option value="">Select team…</option>
            {lookups.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reporting Manager" required error={errors.reportingManagerId}>
          <select className={selectClass} value={formData.reportingManagerId} onChange={(e) => update({ reportingManagerId: e.target.value })}>
            <option value="">Select manager…</option>
            {lookups.managers.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.firstName} ${m.lastName}`.trim() || m.email}
                {m.designation ? ` (${m.designation})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project Manager">
          <select className={selectClass} value={formData.projectManagerId} onChange={(e) => update({ projectManagerId: e.target.value })}>
            <option value="">None</option>
            {lookups.managers.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.firstName} ${m.lastName}`.trim() || m.email}
                {m.designation ? ` (${m.designation})` : ""}
              </option>
            ))}
          </select>
        </Field>
      </motion.div>

      <motion.div variants={item} className="rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
        <div className="mb-2 flex items-center gap-1.5">
          <UsersRound className="h-3.5 w-3.5 text-brand" />
          <h4 className="font-heading text-xs font-semibold text-text-primary">Additional Teams</h4>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {formData.additionalTeamIds.map((teamId) => {
            const team = lookups.teams.find((t) => t.id === teamId);
            if (!team) return null;
            return (
              <span
                key={teamId}
                className="inline-flex items-center gap-1 rounded-full border border-border-base bg-surface px-2.5 py-1 text-[11px] text-text-primary"
              >
                {team.name}
                <button
                  type="button"
                  aria-label={`Remove ${team.name}`}
                  className="text-text-tertiary hover:text-error"
                  onClick={() => {
                    const next = formData.additionalTeamIds.filter((id) => id !== teamId);
                    update({ additionalTeamIds: next });
                  }}
                >
                  ✕
                </button>
              </span>
            );
          })}
          <select
            className="h-7 rounded-full border border-border-base bg-surface px-3 py-1 text-[11px]"
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (value && !formData.additionalTeamIds.includes(value)) {
                update({ additionalTeamIds: [...formData.additionalTeamIds, value] });
              }
              e.currentTarget.value = "";
            }}
          >
            <option value="">＋ Add team</option>
            {lookups.teams
              .filter((t) => t.id !== formData.primaryTeamId && !formData.additionalTeamIds.includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </motion.div>

      <motion.div variants={item} className="space-y-3 rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
        <h4 className="flex items-center gap-1.5 font-heading text-xs font-semibold text-text-primary">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Confirmed Role & Special Access
        </h4>
        <p className="text-xs text-text-secondary">
          Role assigned:{" "}
          <strong className="text-text-primary">{selectedRole?.displayName || "Role Selected (from Step 1)"}</strong>
        </p>

        <label className="flex cursor-pointer select-none items-start gap-2 rounded-md border border-border-base bg-surface p-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded-xs border-border-base text-brand focus:ring-brand"
            checked={formData.isSpecialRole}
            onChange={(e) => update({ isSpecialRole: e.target.checked })}
          />
          <span>
            <span className="block text-xs font-semibold text-text-primary">Special / Executive Role</span>
            <span className="block text-[11px] text-text-tertiary">Grants elevated dashboard & sensitive-data access.</span>
          </span>
        </label>

        {formData.isSpecialRole && (
          <Input
            className="h-8"
            placeholder="Special role name (e.g. CTO, Co-founder)"
            value={formData.specialRoleName}
            onChange={(e) => update({ specialRoleName: e.target.value })}
          />
        )}
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
        <Building2 className="h-3.5 w-3.5" />
        Department is inherited from Step 1:{" "}
        <Badge variant="outline" className="font-mono text-[10px]">
          {lookups.departments.find((d) => d.id === formData.departmentId)?.name ?? "Not selected"}
        </Badge>
      </motion.div>
    </motion.div>
  );
}