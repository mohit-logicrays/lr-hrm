"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { api, Department, ListResponse, Role, User, UserStatus } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { UsersHeader } from "@/components/users/management/UsersHeader";
import { UsersFilterBar } from "@/components/users/management/UsersFilterBar";
import { UserTableRow } from "@/components/users/management/UserTableRow";

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

export default function UsersPage() {
  const router = useRouter();
  const perms = usePermission("user");

  const [result, setResult] = useState<ListResponse<User> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Row selection for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ user: User; newPassword?: string } | null>(null);

  // Load dropdowns & user list
  const loadLookups = useCallback(async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        api.listRoles(),
        api.listDepartments(1, 100),
      ]);
      setRoles(rRes.data);
      setDepartments(dRes.data);
    } catch {
      // Ignore lookup failure
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listUsers(page, 10, search);
      let filtered = res.data;
      if (roleFilter) {
        filtered = filtered.filter((u) => {
          const rId = typeof u.role === "string" ? u.role : u.role.id;
          return rId === roleFilter;
        });
      }
      if (departmentFilter) {
        filtered = filtered.filter((u) => u.departmentId === departmentFilter || u.department?.id === departmentFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter((u) => u.status === statusFilter);
      }

      setResult({
        ...res,
        data: filtered,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, departmentFilter, statusFilter]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Bulk Selection Handlers
  const allSelected =
    Boolean(result?.data.length) && selectedUserIds.length === result?.data.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(result?.data.map((u) => u.id) || []);
    }
  }

  function toggleSelectUser(id: string) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Delete User Handler
  async function handleDelete(u: User) {
    if (!window.confirm(`Are you sure you want to delete "${displayName(u)}"?`)) return;
    try {
      await api.deleteUser(u.id);
      toast.success(`User "${displayName(u)}" deleted`);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  // Status Change Handler
  async function handleStatusChange(u: User, newStatus: UserStatus) {
    try {
      await api.updateUserStatus(u.id, newStatus);
      toast.success(`Updated "${displayName(u)}" status to ${newStatus}`);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  // Reset Password Handler
  async function handleResetPassword(u: User) {
    try {
      const res = await api.resetUserPassword(u.id);
      setResetPasswordModal({ user: u, newPassword: res.data.temporaryPassword });
      toast.success(`Password reset generated for ${displayName(u)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    }
  }

  // Export Users to CSV
  function handleExportCSV() {
    if (!result?.data || result.data.length === 0) {
      toast.error("No user records available to export");
      return;
    }

    const headers = ["Employee ID", "Full Name", "Email", "Role", "Department", "Designation", "Status"];
    const rows = result.data.map((u) => [
      u.employeeId || "—",
      `"${displayName(u)}"`,
      u.email,
      `"${roleName(u)}"`,
      `"${u.department?.name || "—"}"`,
      `"${u.designation || "—"}"`,
      u.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users CSV exported successfully!");
  }

  // Bulk Actions Handlers
  async function handleBulkStatusChange(status: UserStatus) {
    if (selectedUserIds.length === 0) return;
    try {
      await Promise.all(selectedUserIds.map((id) => api.updateUserStatus(id, status)));
      toast.success(`Updated ${selectedUserIds.length} users to ${status}`);
      setSelectedUserIds([]);
      loadUsers();
    } catch {
      toast.error("Bulk status update failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section Component */}
      <UsersHeader
        totalCount={result?.pagination.total || 0}
        selectedCount={selectedUserIds.length}
        canCreate={perms.create}
        onBulkStatusChange={handleBulkStatusChange}
        onExportCSV={handleExportCSV}
      />

      {/* Filter Bar Component */}
      <UsersFilterBar
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(v) => {
          setPage(1);
          setRoleFilter(v);
        }}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={(v) => {
          setPage(1);
          setDepartmentFilter(v);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setPage(1);
          setStatusFilter(v);
        }}
        roles={roles}
        departments={departments}
        onClearFilters={() => {
          setRoleFilter("");
          setDepartmentFilter("");
          setStatusFilter("");
          setSearch("");
        }}
      />

      {/* Data Table Card */}
      <Card className="border border-border-base bg-surface shadow-2xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle/50 hover:bg-surface-subtle/50">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Name &amp; Email</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Role</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Department</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !result?.data || result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-tertiary text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No user records found matching search or filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {result.data.map((u) => (
                    <UserTableRow
                      key={u.id}
                      user={u}
                      isSelected={selectedUserIds.includes(u.id)}
                      canDelete={perms.delete}
                      onToggleSelect={toggleSelectUser}
                      onEdit={setEditUser}
                      onResetPassword={handleResetPassword}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {result?.pagination && (
          <div className="px-4 py-3 border-t border-border-base bg-surface-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-text-tertiary">
              Showing <span className="font-bold text-text-primary">{result.data.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to{" "}
              <span className="font-bold text-text-primary">{Math.min(page * 10, result.pagination.total)}</span> of{" "}
              <span className="font-bold text-text-primary">{result.pagination.total}</span> users
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-mono font-medium text-text-secondary">
                Page {page} of {result.pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(result.pagination.totalPages, p + 1))}
                disabled={page >= (result.pagination.totalPages || 1)}
                className="h-7 w-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      {editUser && (
        <UserEditModal
          user={editUser}
          roles={roles}
          departments={departments}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            loadUsers();
          }}
        />
      )}

      {/* Password Reset Modal */}
      {resetPasswordModal && (
        <Dialog open onOpenChange={() => setResetPasswordModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold font-heading">
                Password Reset Successfully
              </DialogTitle>
              <DialogDescription className="text-xs">
                A new temporary password has been assigned for{" "}
                <strong>{displayName(resetPasswordModal.user)}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 rounded-lg border border-brand/20 bg-brand/5 space-y-1 my-2">
              <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider block">
                Temporary Password
              </span>
              <code className="text-sm font-bold font-mono text-brand block select-all">
                {resetPasswordModal.newPassword}
              </code>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => setResetPasswordModal(null)} className="text-xs h-8">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function UserEditModal({
  user,
  roles,
  departments,
  onClose,
  onSaved,
}: {
  user: User;
  roles: Role[];
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    roleId: typeof user.role === "string" ? user.role : user.role?.id || "",
    departmentId: user.departmentId || user.department?.id || "",
    designation: user.designation || "",
    phone: user.phone || "",
    status: user.status || "ACTIVE",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        designation: form.designation || null,
        roleId: form.roleId || undefined,
        departmentId: form.departmentId || null,
        status: form.status as UserStatus,
      });
      toast.success("User updated successfully");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold font-heading">
            Edit User Profile
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update account details, assigned role, and status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">First Name</Label>
              <Input
                required
                className="text-xs h-8.5"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Last Name</Label>
              <Input
                required
                className="text-xs h-8.5"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Email Address (Read-only)</Label>
            <Input disabled className="text-xs h-8.5 bg-surface-subtle" value={form.email} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Role</Label>
              <select
                className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Department</Label>
              <select
                className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Designation</Label>
              <Input
                className="text-xs h-8.5"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone</Label>
              <Input
                className="text-xs h-8.5"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Status</Label>
            <select
              className="h-8.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs h-8 bg-brand hover:bg-brand-hover text-white">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}