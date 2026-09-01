"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, ListResponse, Pagination, Role, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

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
  const perms = usePermission("user");
  const [result, setResult] = useState<ListResponse<User> | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listUsers(page, 10, search);
      setResult(res);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            User Management
          </h1>
          <p className="text-sm text-text-secondary">
            {pagination
              ? `${pagination.total} users total`
              : "Manage organization members"}
          </p>
        </div>
        {perms.create && (
          <CreateUserDialog onCreated={() => load()}>
            <Button className="rounded-md">
              <Plus /> Create user
            </Button>
          </CreateUserDialog>
        )}
      </div>

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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
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
                  <TableCell className="text-text-secondary">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {roleName(u)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.status === "ACTIVE" ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-error">
                        {u.status ? u.status.charAt(0) + u.status.slice(1).toLowerCase() : "Inactive"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={() => setPage(pagination.previous!)}
            >
              <ChevronLeft /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage(pagination.next!)}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateUserDialog({
  children,
  onCreated,
}: {
  children: React.ReactNode;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleId: "",
    designation: "",
    phone: "",
  });

  useEffect(() => {
    if (!open || roles.length > 0) return;
    api
      .listRoles()
      .then((res) => {
        setRoles(res.data);
        if (!form.roleId && res.data[0]) {
          setForm((f) => ({ ...f, roleId: res.data[0].id }));
        }
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load roles")
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createUser({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
        designation: form.designation || null,
        phone: form.phone || null,
      });
      toast.success(`User created — ${res.data.email}`);
      setOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        roleId: roles[0]?.id ?? "",
        designation: "",
        phone: "",
      });
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            A default password will be set; the user can change it after first
            login.
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
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
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
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !form.roleId}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
