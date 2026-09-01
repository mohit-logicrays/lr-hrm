"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, PermissionGroups, Role } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { roleBadgeClass } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, Pencil, Plus, Shield, Trash2 } from "lucide-react";

type RoleDialogState =
  | { mode: "create" }
  | { mode: "edit"; role: Role }
  | null;

export default function RolesPage() {
  const rolePerms = usePermission("role");
  const permissionPerms = usePermission("permission");

  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionGroups>({});
  const [loading, setLoading] = useState(true);
  const [roleDialog, setRoleDialog] = useState<RoleDialogState>(null);
  const [permissionRole, setPermissionRole] = useState<Role | null>(null);

  const canManage = rolePerms.manage || rolePerms.update || rolePerms.delete || rolePerms.create;
  const canManagePermissions = permissionPerms.manage || rolePerms.manage;

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([api.listRoles(), api.listPermissions()]);
      setRoles(r.data);
      setGroups(p.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(role: Role) {
    if (!window.confirm(`Delete role "${role.displayName}"?`)) return;
    try {
      await api.deleteRole(role.id);
      toast.success("Role deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle={`${roles.length} roles configured`}
        actions={
          canManage ? (
            <Button onClick={() => setRoleDialog({ mode: "create" })}>
              <Plus /> New role
            </Button>
          ) : undefined
        }
      />

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <span className="font-medium">{role.displayName}</span>
                    {role.description ? (
                      <p className="text-xs text-text-tertiary line-clamp-1">
                        {role.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleBadgeClass(role.name)}>
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.isSpecial ? (
                      <Badge className="bg-brand-soft text-brand">Special</Badge>
                    ) : role.isSystem ? (
                      <Badge className="bg-neutral-100 text-neutral-700">
                        System
                      </Badge>
                    ) : (
                      <Badge className="border-border bg-surface text-text-secondary">
                        Custom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {role.priority ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {role._count?.users ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {role.isSpecial ? (
                      <span className="text-info">All</span>
                    ) : (
                      `${role.permissionKeys?.length ?? 0}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {role.isSpecial || role.isSystem ? null : canManagePermissions ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Configure permissions"
                          onClick={() => setPermissionRole(role)}
                        >
                          <KeyRound />
                        </Button>
                      ) : null}
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit role"
                          onClick={() => setRoleDialog({ mode: "edit", role })}
                        >
                          <Pencil />
                        </Button>
                      ) : null}
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete role"
                          className="text-muted-foreground hover:text-error"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            Permission catalog
          </CardTitle>
          <CardDescription>
            All permission keys available in the system, grouped by module.
            Permissions are granted per role as <code>resource:action</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groups).map(([group, perms]) => (
              <div
                key={group}
                className="rounded-lg border border-border-base bg-surface-subtle p-3"
              >
                <h3 className="mb-2 text-sm font-semibold capitalize text-text-primary">
                  {group}
                </h3>
                <ul className="space-y-1.5">
                  {perms.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-baseline justify-between gap-2 text-xs"
                    >
                      <code className="text-text-secondary">{p.key}</code>
                      {p.description ? (
                        <span className="truncate text-text-tertiary">
                          {p.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {roleDialog && (
        <RoleFormDialog
          state={roleDialog}
          onClose={() => setRoleDialog(null)}
          onSaved={() => {
            setRoleDialog(null);
            load();
          }}
        />
      )}

      {permissionRole && (
        <RolePermissionsDialog
          role={permissionRole}
          groups={groups}
          onClose={() => setPermissionRole(null)}
          onSaved={() => {
            setPermissionRole(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function RoleFormDialog({
  state,
  onClose,
  onSaved,
}: {
  state: RoleDialogState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state?.mode === "edit";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: isEdit ? (state as { role: Role }).role.name : "",
    displayName: isEdit ? (state as { role: Role }).role.displayName : "",
    description: isEdit
      ? ((state as { role: Role }).role.description ?? "")
      : "",
    priority: String(isEdit ? (state as { role: Role }).role.priority ?? 0 : 0),
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const role = (state as { role: Role }).role;
        await api.updateRole(role.id, {
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
        toast.success("Role updated");
      } else {
        await api.createRole({
          name: form.name,
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
        toast.success("Role created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update display name, description and priority."
              : "Define a new role. Use lowercase letters, numbers and underscores."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="name">Role key</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              required
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (lower = higher rank)</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RolePermissionsDialog({
  role,
  groups,
  onClose,
  onSaved,
}: {
  role: Role;
  groups: PermissionGroups;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role.permissionKeys ?? [])
  );
  const [saving, setSaving] = useState(false);

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleGroup(groupKeys: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const key of groupKeys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api.setRolePermissions(role.id, [...selected]);
      toast.success("Permissions updated");
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save permissions"
      );
    } finally {
      setSaving(false);
    }
  }

  const locked = role.isSpecial || role.isSystem;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Permissions — {role.displayName}
          </DialogTitle>
          <DialogDescription>
            {locked
              ? "This role cannot be modified. Special roles inherit all permissions; system roles are seeded."
              : `Select the permission keys granted to ${role.displayName}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(groups).map(([group, perms]) => {
            const groupKeys = perms.map((p) => p.key);
            const allChecked = groupKeys.every((k) => selected.has(k));
            const someChecked = groupKeys.some((k) => selected.has(k));
            return (
              <div
                key={group}
                className="rounded-lg border border-border-base p-3"
              >
                <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-semibold capitalize text-text-primary">
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked && !allChecked;
                    }}
                    onChange={(e) =>
                      toggleGroup(groupKeys, e.target.checked)
                    }
                  />
                  {group}
                </label>
                <div className="grid gap-x-6 gap-y-1 pl-6 sm:grid-cols-2">
                  {perms.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary"
                    >
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={selected.has(p.key)}
                        onChange={(e) => toggle(p.key, e.target.checked)}
                      />
                      <code>{p.key}</code>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          {locked ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save permissions"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}