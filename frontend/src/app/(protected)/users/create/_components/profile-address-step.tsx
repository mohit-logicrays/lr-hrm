import { motion } from "framer-motion";
import { MapPin, HeartHandshake, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "./field-error";
import { selectClass } from "./step-common";
import type { Address, WizardFormData, WizardErrors } from "./types";

interface ProfileAddressStepProps {
  formData: WizardFormData;
  errors: WizardErrors;
  update: (patch: Partial<WizardFormData>) => void;
}

const container = {
  hidden: { opacity: 1 },
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

function AddressBlock({
  title,
  data,
  sameAsCurrent,
  onSameAsCurrent,
  isCurrent,
  updateAddress,
}: {
  title: string;
  data: Address;
  sameAsCurrent?: boolean;
  onSameAsCurrent?: (checked: boolean) => void;
  isCurrent?: boolean;
  updateAddress: (patch: Partial<Address>) => void;
}) {
  return (
    <motion.div variants={item} className="space-y-2 rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 font-heading text-xs font-semibold text-text-primary">
          <MapPin className="h-3.5 w-3.5 text-brand" /> {title}
        </h4>
        {onSameAsCurrent && (
          <label className="flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-brand">
            <input
              type="checkbox"
              checked={Boolean(sameAsCurrent)}
              onChange={(e) => onSameAsCurrent(e.target.checked)}
              className="h-3.5 w-3.5 rounded-xs border-border-base text-brand focus:ring-brand"
            />
            Same as current
          </label>
        )}
      </div>

      {isCurrent || !sameAsCurrent ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input
            className="h-8 col-span-full"
            placeholder="Address Line 1"
            value={data.line1}
            onChange={(e) => updateAddress({ line1: e.target.value })}
          />
          <Input className="h-8 col-span-full" placeholder="Address Line 2" value={data.line2} onChange={(e) => updateAddress({ line2: e.target.value })} />
          <Input className="h-8" placeholder="City" value={data.city} onChange={(e) => updateAddress({ city: e.target.value })} />
          <Input className="h-8" placeholder="State" value={data.state} onChange={(e) => updateAddress({ state: e.target.value })} />
          <Input className="h-8" placeholder="Pincode" value={data.pincode} onChange={(e) => updateAddress({ pincode: e.target.value })} />
          <Input className="h-8" placeholder="Country" value={data.country} onChange={(e) => updateAddress({ country: e.target.value })} />
        </div>
      ) : (
        <p className="py-2 text-xs italic text-text-tertiary">Copied from current address.</p>
      )}
    </motion.div>
  );
}

export function ProfileAddressStep({ formData, errors, update }: ProfileAddressStepProps) {
  const updateCurrent = (patch: Partial<Address>) =>
    update({ currentAddress: { ...formData.currentAddress, ...patch } });
  const updatePermanent = (patch: Partial<Address>) =>
    update({ permanentAddress: { ...formData.permanentAddress, ...patch } });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h3 className="font-heading text-base font-bold text-text-primary">Step 2: Personal Profile & Address</h3>
        <p className="text-xs text-text-tertiary">Personal details, government IDs, and residential addresses.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Date of Birth" error={errors.dateOfBirth}>
          <Input type="date" className="h-9" value={formData.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Blood Group">
          <select className={selectClass} value={formData.bloodGroup} onChange={(e) => update({ bloodGroup: e.target.value })}>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Marital Status">
          <select className={selectClass} value={formData.maritalStatus} onChange={(e) => update({ maritalStatus: e.target.value })}>
            {["Single", "Married", "Divorced", "Widowed"].map((ms) => (
              <option key={ms} value={ms}>
                {ms}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nationality">
          <Input className="h-9" value={formData.nationality} onChange={(e) => update({ nationality: e.target.value })} />
        </Field>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-primary">
            Aadhaar Number
          </label>
          <Input
            className="h-9 font-mono"
            placeholder="1234 5678 9012"
            value={formData.aadhaarNumber}
            onChange={(e) => update({ aadhaarNumber: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-primary">PAN Number</label>
          <Input
            className="h-9 font-mono uppercase"
            placeholder="ABCDE1234F"
            value={formData.panNumber}
            onChange={(e) => update({ panNumber: e.target.value })}
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AddressBlock
          title="Current Address"
          isCurrent
          data={formData.currentAddress}
          updateAddress={updateCurrent}
        />
        <AddressBlock
          title="Permanent Address"
          data={formData.permanentAddress}
          sameAsCurrent={formData.sameAsCurrentAddress}
          onSameAsCurrent={(checked) =>
            update({
              sameAsCurrentAddress: checked,
              permanentAddress: checked ? { ...formData.currentAddress } : formData.permanentAddress,
            })
          }
          updateAddress={updatePermanent}
        />
      </motion.div>

      <motion.div variants={item} className="space-y-2 rounded-lg border border-border-base bg-surface-subtle/30 p-3.5">
        <h4 className="flex items-center gap-1.5 font-heading text-xs font-semibold text-text-primary">
          <HeartHandshake className="h-3.5 w-3.5 text-brand" /> Emergency Contact
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input className="h-8" placeholder="Contact Person Name" value={formData.emergencyContactName} onChange={(e) => update({ emergencyContactName: e.target.value })} />
          <Input className="h-8" placeholder="Relation (e.g. Spouse, Father)" value={formData.emergencyContactRelation} onChange={(e) => update({ emergencyContactRelation: e.target.value })} />
          <Input className="h-8" placeholder="Emergency Phone Number" value={formData.emergencyContactPhone} onChange={(e) => update({ emergencyContactPhone: e.target.value })} />
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="LinkedIn URL" error={errors.linkedinUrl}>
          <Input className="h-8" placeholder="https://linkedin.com/in/…" value={formData.linkedinUrl} onChange={(e) => update({ linkedinUrl: e.target.value })} />
        </Field>
        <Field label="Portfolio URL" error={errors.portfolioUrl}>
          <Input className="h-8" placeholder="https://…" value={formData.portfolioUrl} onChange={(e) => update({ portfolioUrl: e.target.value })} />
        </Field>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
        <IdCard className="h-3.5 w-3.5" /> Government ID fields are optional; verified during onboarding.
      </motion.div>
    </motion.div>
  );
}