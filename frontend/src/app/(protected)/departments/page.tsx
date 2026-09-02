"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
import { DepartmentFormSheet } from "@/components/departments/DepartmentFormSheet";

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

  // Side Drawer Sheet (create/edit)
  const [formSheet, setFormSheet] = useState<"create" | { edit: Department } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listDepartments(page, 100, search);
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

  // Filter & Sort departments
  const filteredAndSortedDepartments = useMemo(() => {
    if (!result?.data) return [];
    let list = [...result.data];

    if (statusFilter === "active") {
      list = list.filter((d) => (d._count?.users ?? 0) > 0 || (d._count?.teams ?? 0) > 0);
    } else if (statusFilter === "inactive") {
      list = list.filter((d) => (d._count?.users ?? 0) === 0 && (d._count?.teams ?? 0) === 0);
    }

    list.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return list;
  }, [result?.data, statusFilter, sortOrder]);

  const activeCount = useMemo(() => {
    return (result?.data ?? []).filter(
      (d) => (d._count?.users ?? 0) > 0 || (d._count?.teams ?? 0) > 0
    ).length;
  }, [result?.data]);

  const inactiveCount = useMemo(() => {
    return (result?.data ?? []).filter(
      (d) => (d._count?.users ?? 0) === 0 && (d._count?.teams ?? 0) === 0
    ).length;
  }, [result?.data]);

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

  return (
    <div className="space-y-4">
      {/* Header Section Component */}
      <DepartmentsHeader
        totalCount={result?.total || 0}
        canCreate={perms.create}
        onAddClick={() => setFormSheet("create")}
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
        totalCount={result?.data.length || 0}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {/* Main Content: Bento Grid or Table List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-3.5 space-y-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-2.5 w-14" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                    <Skeleton className="h-2.5 w-full" />
                    <div className="pt-2 border-t border-border-base flex justify-between items-center">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-14 rounded-md" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border-base bg-surface shadow-2xs rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </motion.div>
        ) : filteredAndSortedDepartments.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-base py-8 text-center bg-surface"
          >
            <div className="rounded-full bg-surface-subtle p-2 text-text-tertiary">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="mt-2 text-xs font-semibold text-text-primary">No departments found</h3>
            <p className="mt-0.5 text-[11px] text-text-tertiary max-w-sm">
              {search || statusFilter
                ? "No departments matched your search or filter criteria."
                : "No departments have been created yet."}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedDepartments.map((d, idx) => (
                <DepartmentCard
                  key={d.id}
                  department={d}
                  index={idx}
                  perms={{ update: perms.update, delete: perms.delete }}
                  onEdit={(dept) => setFormSheet({ edit: dept })}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Table List Mode */
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border border-border-base bg-surface shadow-2xs rounded-lg overflow-hidden">
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
                  {filteredAndSortedDepartments.map((d) => (
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
                            <Button variant="ghost" size="icon-sm" onClick={() => setFormSheet({ edit: d })}>
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
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Side Pull-Drawer Sheet (Create / Edit) */}
      {formSheet && (
        <DepartmentFormSheet
          department={formSheet === "create" ? null : formSheet.edit}
          onClose={() => setFormSheet(null)}
          onSaved={() => {
            setFormSheet(null);
            load();
          }}
        />
      )}
    </div>
  );
}