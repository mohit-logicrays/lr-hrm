"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type PermissionGroups, type Role } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save } from "lucide-react";
import { getModuleIcon } from "./role-helpers";
import { dialogVariants } from "./motion";

type ModalRoleState = "create" | { edit: Role };

export function CreateRoleAndPermissionsModal({
  state,
  groups,
  onClose,
  onSaved,
}: {
  state: ModalRoleState;
  groups: PermissionGroups;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state !== "create";
  const targetRole = isEdit ? (state as { edit: Role }).edit : null;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: targetRole?.name ?? "",
    displayName: targetRole?.displayName ?? "",
    description: targetRole?.description ?? "",
    priority: String(targetRole?.priority ?? 0),
  }));

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(targetRole?.permissionKeys ?? [])
  );

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    Object.values(groups).forEach((list) => {
      list.forEach((p) => keys.push(p.key));
    });
    return keys;
  }, [groups]);

  const isAllSelected = useMemo(() => {
    return allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
  }, [allKeys, selectedKeys]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedKeys(new Set(allKeys));
    } else {
      setSelectedKeys(new Set());
    }
  }

  function toggleModuleAction(groupName: string, actionType: "read" | "create" | "update" | "delete" | "all", checked: boolean) {
    const groupPerms = groups[groupName] || [];
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => {
        const [, act] = p.key.split(":");
        const matchesAction =
          actionType === "all" ||
          (actionType === "read" && (act === "read" || act === "list" || act === "get")) ||
          (actionType === "create" && (act === "create" || act === "add")) ||
          (actionType === "update" && (act === "update" || act === "edit" || act === "patch")) ||
          (actionType === "delete" && (act === "delete" || act === "remove"));

        if (matchesAction) {
          if (checked) next.add(p.key);
          else next.delete(p.key);
        }
      });
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let roleId = targetRole?.id;

      if (isEdit && roleId) {
        await api.updateRole(roleId, {
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
      } else {
        const res = await api.createRole({
          name: form.name,
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
        roleId = res.data.id;
      }

      if (roleId) {
        await api.setRolePermissions(roleId, [...selectedKeys]);
      }

      toast.success(isEdit ? "Role & permissions updated" : "Role created & permissions assigned");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  const affectedUserCount = targetRole?._count?.users ?? 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-xl sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col bg-surface border border-border-base">
        <motion.div
          variants={dialogVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex flex-col max-h-[90vh]"
        >
          <DialogHeader className="px-6 py-4 border-b border-border-base bg-surface-subtle/40 flex items-center justify-between flex-row">
            <div>
              <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                {isEdit ? "Edit Role & Configure Permissions" : "Create Role & Configure Permissions"}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-tertiary mt-0.5">
                Define access levels and granular permissions for this role.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7 space-y-3">
                {!isEdit && (
                  <div className="space-y-1">
                    <Label htmlFor="modal-role-name" className="text-xs font-semibold text-text-primary">
                      Role Key / Code
                    </Label>
                    <Input
                      id="modal-role-name"
                      required
                      placeholder="e.g. senior_hr_manager, qa_lead"
                      className="text-xs h-8"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="modal-role-displayName" className="text-xs font-semibold text-text-primary">
                    Role Display Name
                  </Label>
                  <Input
                    id="modal-role-displayName"
                    required
                    placeholder="e.g., Senior HR Manager"
                    className="text-xs h-8"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="modal-role-description" className="text-xs font-semibold text-text-primary">
                    Description
                  </Label>
                  <textarea
                    id="modal-role-description"
                    rows={2}
                    placeholder="Describe the responsibilities and access scope..."
                    className="w-full rounded-md border border-border-base bg-surface p-2 text-xs font-normal text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none min-h-[60px] resize-y leading-relaxed"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="md:col-span-5 bg-surface-subtle/50 p-3.5 rounded-xl border border-border-base space-y-2">
                <h4 className="font-semibold text-xs font-heading text-text-primary">
                  Assigned Users Preview
                </h4>
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full border-2 border-surface bg-brand/10 font-bold text-[10px] text-brand flex items-center justify-center border-brand/20">
                      JD
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-surface bg-info/10 font-bold text-[10px] text-info flex items-center justify-center border-info/20">
                      AS
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-surface bg-warning/10 font-bold text-[10px] text-warning flex items-center justify-center border-warning/20">
                      +{affectedUserCount}
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary font-medium">
                    {affectedUserCount} {affectedUserCount === 1 ? "user" : "users"} will be affected by these changes.
                  </span>
                </div>
                <p className="text-[10px] text-text-tertiary italic">
                  Note: Permissions apply immediately to all users assigned to this role upon saving.
                </p>
              </div>
            </div>

            <hr className="border-border-base" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-text-primary font-heading">
                    Module Permissions
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Configure granular access rights for each system module.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4"
                  />
                  <span className="text-xs font-medium text-text-primary hover:text-brand transition-colors">
                    Select All Permissions
                  </span>
                </label>
              </div>

              <div className="border border-border-base rounded-xl overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-surface-subtle/80">
                    <TableRow>
                      <TableHead className="font-semibold text-text-primary text-xs">Module Category</TableHead>
                      <TableHead className="font-semibold text-text-primary text-xs text-center w-20">View</TableHead>
                      <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Create</TableHead>
                      <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Edit</TableHead>
                      <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Delete</TableHead>
                      <TableHead className="font-semibold text-text-primary text-xs text-center w-20">All</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groups).map(([groupName, groupPerms], idx) => {
                      const ModuleIcon = getModuleIcon(groupName);
                      const groupKeys = groupPerms.map((p) => p.key);

                      const viewKeys = groupKeys.filter((k) => k.endsWith(":read") || k.endsWith(":list") || k.endsWith(":get"));
                      const createKeys = groupKeys.filter((k) => k.endsWith(":create") || k.endsWith(":add"));
                      const updateKeys = groupKeys.filter((k) => k.endsWith(":update") || k.endsWith(":edit") || k.endsWith(":patch"));
                      const deleteKeys = groupKeys.filter((k) => k.endsWith(":delete") || k.endsWith(":remove"));

                      const isViewChecked = viewKeys.length > 0 && viewKeys.every((k) => selectedKeys.has(k));
                      const isCreateChecked = createKeys.length > 0 && createKeys.every((k) => selectedKeys.has(k));
                      const isUpdateChecked = updateKeys.length > 0 && updateKeys.every((k) => selectedKeys.has(k));
                      const isDeleteChecked = deleteKeys.length > 0 && deleteKeys.every((k) => selectedKeys.has(k));
                      const isGroupAllChecked = groupKeys.length > 0 && groupKeys.every((k) => selectedKeys.has(k));

                      return (
                        <motion.tr
                          key={groupName}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.03 }}
                          className="hover:bg-surface-subtle/40"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-surface-subtle text-brand border border-border-base">
                                <ModuleIcon className="h-4 w-4" />
                              </div>
                              <span className="font-semibold text-xs text-text-primary capitalize font-heading">
                                {groupName} Management
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={viewKeys.length === 0}
                              checked={isViewChecked}
                              onChange={(e) => toggleModuleAction(groupName, "read", e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={createKeys.length === 0}
                              checked={isCreateChecked}
                              onChange={(e) => toggleModuleAction(groupName, "create", e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={updateKeys.length === 0}
                              checked={isUpdateChecked}
                              onChange={(e) => toggleModuleAction(groupName, "update", e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={deleteKeys.length === 0}
                              checked={isDeleteChecked}
                              onChange={(e) => toggleModuleAction(groupName, "delete", e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                            />
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isGroupAllChecked}
                              onChange={(e) => toggleModuleAction(groupName, "all", e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer"
                            />
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border-base">
              <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving} className="text-xs h-8">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="text-xs h-8 gap-1.5 shadow-2xs">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : isEdit ? "Save Role & Permissions" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}