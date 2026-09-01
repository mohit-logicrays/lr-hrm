"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Department, ListResponse, Role, User, UserStatus } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

function displayName(u: User): string {
  return (
    u.name?.trim() ||
    [u.firstName, u.lastName].filter((p): p is string => Boolean(p)).join(" ") ||
    u.email
  );
}

function roleName(u: User): string {
  return typeof u.role === "string" ? u.role : u.role.displayName || u.role.name;
}

const USER_STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UsersPage() {
  const perms = usePermission("user");
  const [result, setResult] = useState<ListResponse<User> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: User } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listUsers(page, 10, search);
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(u: User) {
    if (!window.confirm(`Delete user "${displayName(u)}"?`)) return;
    try {
      await api.deleteUser(u.id);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        subtitle={result ? `${result.pagination.total} users` : "Manage organization members"}
        actions={
          perms.create ? (
            <Button onClick={() => setDialog("create")}>
              <Plus /> Create user
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              result?.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{displayName(u)}</TableCell>
                  <TableCell className="text-text-secondary">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={roleBadgeClass(u)}>{roleName(u)}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {u.department?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {u.designation ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {perms.update && (
                        <Button variant="ghost" size="icon-sm" aria-label="Edit user" onClick={() => setDialog({ edit: u })}>
                          <Pencil />
                        </Button>
                      )}
                      {perms.delete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete user"
                          className="text-muted-foreground hover:text-error"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        pagination={result?.pagination ?? null}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {dialog && (
        <UserFormDialog
          user={dialog === "create" ? null : (dialog as { edit: User }).edit}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    roleId:
      user && typeof user.role !== "string" ? user.role.id : "",
    departmentId: user?.departmentId ?? user?.department?.id ?? "",
    designation: user?.designation ?? "",
    phone: user?.phone ?? "",
    status: (user?.status ?? "ACTIVE") as UserStatus,
  }));

  useEffect(() => {
    let live = true;
    Promise.all([api.listRoles(), api.listDepartments(1, 100)])
      .then(([r, d]) => {
        if (!live) return;
        setRoles(r.data);
        setDepartments(d.data);
        setForm((f) => ({ ...f, roleId: f.roleId || (r.data[0]?.id ?? "") }));
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load roles")
      );
    return () => {
      live = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        await api.updateUser(user.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          designation: form.designation || null,
          roleId: form.roleId || undefined,
          departmentId: form.departmentId || null,
          status: form.status,
        });
        toast.success("User updated");
      } else {
        await api.createUser({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          designation: form.designation || null,
          roleId: form.roleId,
          departmentId: form.departmentId || null,
          status: form.status,
        });
        toast.success("User created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update profile, role, and membership details."
              : "A default password is set; the user changes it after first login."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              disabled={Boolean(user)}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              >
                {roles.length === 0 && <option value="">Loading…</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName || r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
            >
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !form.roleId}>
              {saving ? "Saving…" : user ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-brand-soft text-brand",
  founder: "bg-brand-soft text-brand",
  ceo: "bg-brand-soft text-brand",
  cto: "bg-brand-soft text-brand",
  coo: "bg-brand-soft text-brand",
  cfo: "bg-brand-soft text-brand",
  hr: "bg-warning-light text-warning",
  manager: "bg-warning-light text-warning",
  lead: "bg-info-light text-info",
  associate: "bg-neutral-100 text-neutral-700",
  member: "bg-neutral-100 text-neutral-700",
};

function roleBadgeClass(u: User): string {
  const key =
    typeof u.role === "string"
      ? u.role.toLowerCase()
      : u.role.name.toLowerCase();
  return ROLE_STYLES[key] ?? "border-border bg-surface text-text-secondary";
}

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  ACTIVE: { dot: "bg-success", label: "Active", text: "text-success" },
  INACTIVE: { dot: "bg-neutral-400", label: "Inactive", text: "text-text-secondary" },
  SUSPENDED: { dot: "bg-error", label: "Suspended", text: "text-error" },
};

function StatusBadge({ status }: { status?: string }) {
  const s =
    STATUS_STYLES[status ?? ""] ?? {
      dot: "bg-neutral-400",
      label: status ? status.charAt(0) + status.slice(1).toLowerCase() : "Inactive",
      text: "text-text-secondary",
    };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}