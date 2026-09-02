"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { api, type Project, type Department, type Team, type User, type ProjectStatus, type ProjectPriority } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsFilterBar } from "@/components/projects/ProjectsFilterBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { CreateProjectSheet } from "@/components/projects/CreateProjectSheet";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  const perms = usePermission("project");
  const [result, setResult] = useState<{ data: Project[]; total: number; totalPages: number } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);

  // Side Drawer Sheet (Create / Edit)
  const [createSheet, setCreateSheet] = useState<"create" | { edit: Project } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, depsRes, teamsRes, usersRes] = await Promise.all([
        api.listProjects(page, 100, search, (statusFilter as ProjectStatus) || undefined, (priorityFilter as ProjectPriority) || undefined),
        api.listDepartments(1, 100),
        api.listTeams(1, 100),
        api.listUsers(1, 100),
      ]);
      setDepartments(depsRes.data);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      setResult({
        data: projectsRes.data,
        total: projectsRes.pagination.total,
        totalPages: projectsRes.pagination.totalPages,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Compute filtered & sorted projects locally
  const filteredAndSortedProjects = useMemo(() => {
    if (!result?.data) return [];
    let list = [...result.data];

    list.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return list;
  }, [result?.data, sortOrder]);

  const activeCount = useMemo(() => {
    return (result?.data ?? []).filter((p) => p.status === "ACTIVE").length;
  }, [result?.data]);

  const planningCount = useMemo(() => {
    return (result?.data ?? []).filter((p) => p.status === "PLANNING").length;
  }, [result?.data]);

  const completedCount = useMemo(() => {
    return (result?.data ?? []).filter((p) => p.status === "COMPLETED").length;
  }, [result?.data]);

  async function handleDelete(project: Project) {
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"?`)) return;
    try {
      await api.deleteProject(project.id);
      toast.success(`Project "${project.name}" deleted`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <ProjectsHeader
        totalCount={result?.total || 0}
        canCreate={perms.create}
        onAddClick={() => setCreateSheet("create")}
      />

      {/* Filter & View Mode Controls */}
      <ProjectsFilterBar
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        totalCount={result?.data.length || 0}
        activeCount={activeCount}
        planningCount={planningCount}
        completedCount={completedCount}
      />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-surface-subtle animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base py-12 text-center bg-surface"
          >
            <div className="rounded-full bg-surface-subtle p-3 text-text-tertiary">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-xs font-bold text-text-primary font-heading">No projects found</h3>
            <p className="mt-1 text-[11px] text-text-tertiary max-w-sm">
              {search || statusFilter || priorityFilter
                ? "No projects matched your criteria."
                : "No projects have been created yet."}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  canUpdate={perms.update}
                  canDelete={perms.delete}
                  onEdit={(proj) => setCreateSheet({ edit: proj })}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Table View */
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProjectTable
              projects={filteredAndSortedProjects}
              loading={loading}
              canUpdate={perms.update}
              canDelete={perms.delete}
              onEdit={(proj) => setCreateSheet({ edit: proj })}
              onDelete={handleDelete}
            />
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

      {/* Multi-step Create / Edit Project Drawer Sheet */}
      {createSheet && (
        <CreateProjectSheet
          project={createSheet === "create" ? null : createSheet.edit}
          departments={departments}
          teams={teams}
          users={users}
          onClose={() => setCreateSheet(null)}
          onSaved={() => {
            setCreateSheet(null);
            load();
          }}
        />
      )}
    </div>
  );
}