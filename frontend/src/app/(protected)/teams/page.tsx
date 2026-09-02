"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { api, type Department, type Team, type TeamDetail } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, UsersRound } from "lucide-react";
import { TeamsPageHeader } from "./_components/teams-page-header";
import { TeamsFiltersBar } from "./_components/teams-filters-bar";
import { TeamCard } from "./_components/team-card";
import { TeamTable } from "./_components/team-table";
import { TeamFormSheet } from "./_components/team-form-sheet";
import { TeamDetailSheet } from "./_components/team-detail-sheet";
import { staggerContainer, fadeInUp } from "./_components/motion";
import type { SortOption, StatusFilter, ViewMode } from "./_components/team-helpers";

export default function TeamsPage() {
  const perms = usePermission("team");
  const [result, setResult] = useState<{
    data: Team[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);

  // Form sheet (create/edit) & Detail sheet (roster)
  const [formSheet, setFormSheet] = useState<"create" | { edit: Team } | null>(null);
  const [detailSheet, setDetailSheet] = useState<{ team: Team; detail: TeamDetail } | null>(null);

  const load = useCallback(async () => {
    try {
      const [teams, deps] = await Promise.all([
        api.listTeams(page, 100, search),
        api.listDepartments(1, 100),
      ]);
      setDepartments(deps.data);
      setResult({
        data: teams.data,
        total: teams.pagination.total,
        totalPages: teams.pagination.totalPages,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(team: Team) {
    api
      .getTeam(team.id)
      .then((res) => setDetailSheet({ team, detail: res.data }))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load team")
      );
  }

  async function reloadDetail() {
    if (!detailSheet) return;
    try {
      const res = await api.getTeam(detailSheet.team.id);
      setDetailSheet((d) => (d ? { team: d.team, detail: res.data } : d));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    }
  }

  async function handleDelete(team: Team) {
    if (!window.confirm(`Delete team "${team.name}"?`)) return;
    try {
      await api.deleteTeam(team.id);
      toast.success("Team deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    }
  }

  // Filter and sort teams locally for instantaneous UI feedback
  const teamsData = result?.data;
  const filteredAndSortedTeams = useMemo(() => {
    if (!teamsData) return [];
    let list = [...teamsData];

    if (departmentFilter) {
      list = list.filter((t) => t.departmentId === departmentFilter);
    }

    if (statusFilter === "active") {
      list = list.filter((t) => (t._count?.members ?? 0) > 0);
    } else if (statusFilter === "inactive") {
      list = list.filter((t) => (t._count?.members ?? 0) === 0);
    }

    list.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "members-desc")
        return (b._count?.members ?? 0) - (a._count?.members ?? 0);
      if (sortBy === "projects-desc")
        return (b._count?.projects ?? 0) - (a._count?.projects ?? 0);
      return 0;
    });

    return list;
  }, [teamsData, departmentFilter, statusFilter, sortBy]);

  const activeCount = useMemo(() => {
    return (teamsData ?? []).filter((t) => (t._count?.members ?? 0) > 0).length;
  }, [teamsData]);

  const inactiveCount = useMemo(() => {
    return (teamsData ?? []).filter((t) => (t._count?.members ?? 0) === 0).length;
  }, [teamsData]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
      <TeamsPageHeader canCreate={perms.create} onCreate={() => setFormSheet("create")} />

      <TeamsFiltersBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        departments={departments}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={result?.data.length ?? 0}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      <AnimatePresence mode="wait">
        {/* Main Content Area */}
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
              <div className="rounded-lg border border-border-base bg-surface">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Projects</TableHead>
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
              </div>
            )}
          </motion.div>
        ) : filteredAndSortedTeams.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-base py-8 text-center bg-surface"
          >
            <div className="rounded-full bg-surface-subtle p-2 text-text-tertiary">
              <UsersRound className="h-5 w-5" />
            </div>
            <h3 className="mt-2 text-xs font-semibold text-text-primary">No teams found</h3>
            <p className="mt-0.5 text-[11px] text-text-tertiary max-w-sm">
              {search || departmentFilter || statusFilter !== "all"
                ? "No teams matched your filter criteria."
                : "No teams have been created yet."}
            </p>
            {perms.create && (
              <Button onClick={() => setFormSheet("create")} className="mt-3 gap-1 h-7 text-xs" size="sm">
                <Plus className="h-3.5 w-3.5" /> Create First Team
              </Button>
            )}
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAndSortedTeams.map((team, idx) => (
              <TeamCard
                key={team.id}
                team={team}
                index={idx}
                perms={{ update: Boolean(perms.update), delete: Boolean(perms.delete) }}
                onOpenDetail={openDetail}
                onEdit={(t) => setFormSheet({ edit: t })}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            variants={fadeInUp}
          >
            <TeamTable
              teams={filteredAndSortedTeams}
              perms={{ update: Boolean(perms.update), delete: Boolean(perms.delete) }}
              onOpenDetail={openDetail}
              onEdit={(t) => setFormSheet({ edit: t })}
              onDelete={handleDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Bar */}
      <motion.div variants={fadeInUp}>
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
      </motion.div>

      {/* Create / Edit Team Sidebar Drawer (Sheet) */}
      <AnimatePresence>
        {formSheet && (
          <TeamFormSheet
            team={formSheet === "create" ? null : (formSheet as { edit: Team }).edit}
            departments={departments}
            onClose={() => setFormSheet(null)}
            onSaved={() => {
              setFormSheet(null);
              load();
            }}
          />
        )}

        {/* Team Member Management & Roster Sidebar Drawer (Sheet) */}
        {detailSheet && (
          <TeamDetailSheet
            team={detailSheet.team}
            detail={detailSheet.detail}
            canManageMembers={Boolean(perms.manage_members)}
            canManageLeads={Boolean(perms.manage_leads)}
            onClose={() => setDetailSheet(null)}
            onChanged={() => {
              reloadDetail();
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}