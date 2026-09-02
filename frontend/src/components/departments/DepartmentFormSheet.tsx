"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type Department } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const sheetVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
};

export function DepartmentFormSheet({
  department,
  onClose,
  onSaved,
}: {
  department: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: department?.name ?? "",
    code: department?.code ?? "",
    description: department?.description ?? "",
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (department) {
        await api.updateDepartment(department.id, {
          name: form.name,
          description: form.description || null,
        });
        toast.success("Department updated successfully");
      } else {
        await api.createDepartment({
          name: form.name,
          code: form.code,
          description: form.description || null,
        });
        toast.success("Department created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-surface overflow-hidden">
        <SheetHeader className="p-3 border-b border-border-base bg-surface-subtle/30">
          <div className="pr-6">
            <SheetTitle className="font-heading text-sm font-bold text-text-primary">
              {department ? "Edit Department" : "Create New Department"}
            </SheetTitle>
            <SheetDescription className="text-[10px] text-text-tertiary mt-0.5">
              {department
                ? "Update department parameters, code, and rich description."
                : "Create a new organizational department."}
            </SheetDescription>
          </div>
        </SheetHeader>

        <motion.form
          variants={sheetVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          onSubmit={onSubmit}
          className="flex-1 flex flex-col overflow-y-auto p-3 space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="sheet-dept-name" className="text-xs font-semibold text-text-primary">
              Department Name *
            </Label>
            <Input
              id="sheet-dept-name"
              required
              placeholder="e.g. Python Development, Artificial Intelligence"
              className="text-xs h-8"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {!department && (
            <div className="space-y-1">
              <Label htmlFor="sheet-dept-code" className="text-xs font-semibold text-text-primary">
                Department Code * (Unique Uppercase)
              </Label>
              <Input
                id="sheet-dept-code"
                required
                placeholder="e.g. PY, AI, FE"
                className="text-xs h-8 font-mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">
              Rich Description Editor
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(htmlValue) => setForm({ ...form, description: htmlValue })}
              placeholder="Write rich department description with formatting, headings, lists..."
            />
          </div>

          <div className="mt-auto pt-3 border-t border-border-base flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving} className="text-xs h-7">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || (!department && !form.code)} className="text-xs h-7 bg-brand hover:bg-brand-hover text-white">
              {saving ? "Saving..." : department ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </motion.form>
      </SheetContent>
    </Sheet>
  );
}
