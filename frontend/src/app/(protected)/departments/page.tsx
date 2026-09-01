"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Department } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function DepartmentsPage() {
  const perms = usePermission("department");
  const [result, setResult] = useState<{
    data: Department[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: Department } | null>(
    null
  );

  const load = useCallback(async () => {
    try {
      const res = await api.listDepartments(page, 10, search);
      setResult({
        data: res.data,
        total: res.pagination.total,
        totalPages: res.pagination.totalPages,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(d: Department) {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    try {
      await api.deleteDepartment(d.id);
      toast.success("Department deleted");
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete department"
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments"
        subtitle={result ? `${result.total} departments` : "Organization units"}
        actions={
          perms.create ? (
            <Button onClick={() => setDialog("create")}>
              <Plus /> New department
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          className="pl-9"
          placeholder="Search name or code…"
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
              <TableHead>Code</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              result?.data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <span className="font-medium">{d.name}</span>
                    {d.description ? (
                      <p className="text-xs text-text-tertiary line-clamp-1">
                        {d.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge className="border-border bg-surface text-text-secondary">
                      {d.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {d._count?.teams ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {d._count?.users ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {perms.update && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit department"
                          onClick={() => setDialog({ edit: d })}
                        >
                          <Pencil />
                        </Button>
                      )}
                      {perms.delete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete department"
                          className="text-muted-foreground hover:text-error"
                          onClick={() => handleDelete(d)}
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
        pagination={
          result
            ? {
                total: result.total,
                page,
                pageSize: 10,
                totalPages: result.totalPages,
                hasPrevious: page > 1,
                hasNext: page < result.totalPages,
                previous: page > 1 ? page - 1 : null,
                next: page < result.totalPages ? page + 1 : null,
              }
            : null
        }
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {dialog && (
        <DepartmentFormDialog
          department={dialog === "create" ? null : (dialog as { edit: Department }).edit}
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

function DepartmentFormDialog({
  department,
  onClose,
  onSaved,
}: {
  department: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: department?.name ?? "",
    code: department?.code ?? "",
    description: department?.description ?? "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (department) {
        await api.updateDepartment(department.id, {
          name: form.name,
          description: form.description || null,
        });
        toast.success("Department updated");
      } else {
        await api.createDepartment({
          name: form.name,
          code: form.code,
          description: form.description || null,
        });
        toast.success("Department created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit department" : "Create department"}
          </DialogTitle>
          <DialogDescription>
            Departments group teams and users within the organization.
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
          {!department && (
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="ENG"
              />
            </div>
          )}
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
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : department ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}