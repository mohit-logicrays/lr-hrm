"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, ListResponse, Pagination, User } from "@/lib/api";
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

const ROLES = [
  "hr",
  "team_lead",
  "project_manager",
  "project_lead",
  "member",
] as const;

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
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-text-secondary">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {u.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.isActive !== false ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-error">Inactive</span>
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
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member",
    designation: "",
    phone: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createUser(form as Partial<User>);
      const sent = (res.data as User & { emailSent?: boolean }).emailSent;
      toast.success(
        sent
          ? `User created — credentials emailed to ${res.data.email}`
          : "User created — email failed to send"
      );
      setOpen(false);
      setForm({ name: "", email: "", role: "member", designation: "", phone: "" });
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
            A random password will be generated and emailed to the user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
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
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
