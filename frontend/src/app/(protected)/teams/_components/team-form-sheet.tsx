"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type Department, type Team } from "@/lib/api";
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
import { sheetVariants } from "./motion";

export function TeamFormSheet({
  team,
  departments,
  onClose,
  onSaved,
}: {
  team: Team | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: team?.name ?? "",
    description: team?.description ?? "",
    departmentId: team?.departmentId ?? departments[0]?.id ?? "",
  }));

  useEffect(() => {
    if (!form.departmentId && departments[0]) {
      setForm((f) => ({ ...f, departmentId: departments[0].id }));
    }
  }, [departments, form.departmentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (team) {
        await api.updateTeam(team.id, {
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team updated successfully");
      } else {
        await api.createTeam({
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save team");
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
              {team ? "Edit Team" : "Create New Team"}
            </SheetTitle>
            <SheetDescription className="text-[10px] text-text-tertiary mt-0.5">
              {team
                ? "Update team details, rich description, and department assignment."
                : "Create a new functional team within a department."}
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
            <Label htmlFor="sheet-name" className="text-xs font-semibold text-text-primary">
              Team Name
            </Label>
            <Input
              id="sheet-name"
              required
              placeholder="e.g. Python Core, Mobile Development"
              className="text-xs h-8"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sheet-departmentId" className="text-xs font-semibold text-text-primary">
              Department
            </Label>
            <select
              id="sheet-departmentId"
              required
              className="h-8 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              {departments.length === 0 && <option value="">Loading departments...</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">
              Rich Description Editor
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(htmlValue) => setForm({ ...form, description: htmlValue })}
              placeholder="Write rich team description with bold, italic, headings, lists, quotes..."
            />
          </div>

          <div className="mt-auto pt-3 border-t border-border-base flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving} className="text-xs h-7">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !form.departmentId} className="text-xs h-7">
              {saving ? "Saving..." : team ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </motion.form>
      </SheetContent>
    </Sheet>
  );
}