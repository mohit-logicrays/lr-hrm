"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { api, Department } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { DepartmentsHeader } from "@/components/departments/DepartmentsHeader";
import { DepartmentsFilterBar } from "@/components/departments/DepartmentsFilterBar";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { DepartmentFormModal } from "@/components/departments/DepartmentFormModal";

export default function DepartmentsPage() {
  const perms = usePermission("department");
  const [result, setResult] = useState<{
    data: Department[];
    total: number;
    totalPages: number;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: Department } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listDepartments(page, 12, search);

      let data = res.data;

      // Local sorting
      data = data.sort((a, b) =>
        sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );

      setResult({
        data,
        total: res.pagination.total,
        totalPages: res.pagination.totalPages,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(d: Department) {
    if (!window.confirm(`Are you sure you want to delete department "${d.name}"?`)) return;
    try {
      await api.deleteDepartment(d.id);
      toast.success(`Department "${d.name}" deleted`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete department");
    }
  }

  async function handleSaveDepartment(payload: { name: string; code?: string; description?: string }) {
    try {
      if (dialog && typeof dialog === "object" && "edit" in dialog) {
        await api.updateDepartment(dialog.edit.id, {
          name: payload.name,
          description: payload.description || null,
        });
        toast.success("Department updated successfully");
      } else {
        await api.createDepartment({
          name: payload.name,
          code: payload.code || "DPT",
          description: payload.description || null,
        });
        toast.success("Department created successfully");
      }
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section Component */}
      <DepartmentsHeader
        totalCount={result?.total || 0}
        canCreate={perms.create}
        onAddClick={() => setDialog("create")}
      />

      {/* Filter & Control Bar Component */}
      <DepartmentsFilterBar
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        totalCount={result?.total || 0}
      />

      {/* Main Content: Bento Grid or Table List */}
      {viewMode === "grid" ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-full" />
              </Card>
            ))}
          </div>
        ) : !result?.data || result.data.length === 0 ? (
          <Card className="p-12 text-center text-text-tertiary text-xs">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No departments found matching your criteria.
          </Card>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {result.data.map((d) => (
                <DepartmentCard
                  key={d.id}
                  department={d}
                  canUpdate={perms.update}
                  canDelete={perms.delete}
                  onEdit={(dept) => setDialog({ edit: dept })}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : (
        /* Table List Mode */
        <Card className="border border-border-base bg-surface shadow-2xs rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle/50">
                <TableHead className="font-bold text-xs uppercase">Department</TableHead>
                <TableHead className="font-bold text-xs uppercase">Code</TableHead>
                <TableHead className="font-bold text-xs uppercase">Teams</TableHead>
                <TableHead className="font-bold text-xs uppercase">Employees</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
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
                  <TableRow key={d.id} className="hover:bg-surface-subtle/40">
                    <TableCell>
                      <span className="font-bold text-xs text-text-primary font-heading block">{d.name}</span>
                      {d.description && <span className="text-[11px] text-text-tertiary line-clamp-1">{d.description}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        DPT-{d.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary font-medium">
                      {d._count?.teams ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary font-medium">
                      {d._count?.users ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {perms.update && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDialog({ edit: d })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {perms.delete && (
                          <Button variant="ghost" size="icon-sm" className="text-error" onClick={() => handleDelete(d)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination Footer */}
      <PaginationBar
        pagination={
          result
            ? {
                total: result.total,
                page,
                pageSize: 12,
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

      {/* Form Modal Component */}
      {dialog && (
        <DepartmentFormModal
          department={dialog === "create" ? null : (dialog as { edit: Department }).edit}
          onClose={() => setDialog(null)}
          onSave={handleSaveDepartment}
        />
      )}
    </div>
  );
}