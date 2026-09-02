"use client";

import { useState, FormEvent } from "react";
import { Department } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DepartmentFormModalProps {
  department: Department | null;
  onClose: () => void;
  onSave: (payload: { name: string; code?: string; description?: string }) => Promise<void>;
}

export function DepartmentFormModal({
  department,
  onClose,
  onSave,
}: DepartmentFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: department?.name ?? "",
    code: department?.code ?? "",
    description: department?.description ?? "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        code: department ? undefined : form.code,
        description: form.description || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold font-heading">
            {department ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure department parameters, identifiers, and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1">
            <Label htmlFor="dept-name" className="text-xs font-semibold">
              Department Name *
            </Label>
            <Input
              id="dept-name"
              required
              className="text-xs h-8.5"
              placeholder="e.g. Python Development"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {!department && (
            <div className="space-y-1">
              <Label htmlFor="dept-code" className="text-xs font-semibold">
                Department Code * (Unique Uppercase)
              </Label>
              <Input
                id="dept-code"
                required
                className="text-xs h-8.5 uppercase font-mono"
                placeholder="e.g. PY"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="dept-desc" className="text-xs font-semibold">
              Description
            </Label>
            <textarea
              id="dept-desc"
              rows={3}
              className="w-full rounded-md border border-border-base bg-surface p-2 text-xs text-text-primary shadow-2xs focus:border-brand focus:outline-none min-h-[70px]"
              placeholder="Brief description of department scope..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs h-8 bg-brand hover:bg-brand-hover text-white">
              {saving ? "Saving..." : department ? "Save Changes" : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
