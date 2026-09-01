"use client";

import { useCallback, useEffect, useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api, Department, Team, TeamDetail, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RichTextEditor, RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  FolderKanban,
  MoreVertical,
  LayoutGrid,
  List,
  Building2,
  ArrowUpDown,
  Terminal,
  Cpu,
  Store,
  Layers,
  Sparkles,
  UserPlus,
  ShieldCheck,
  FileText,
} from "lucide-react";

type SortOption = "name-asc" | "name-desc" | "members-desc" | "projects-desc";
type StatusFilter = "all" | "active" | "inactive";
type ViewMode = "grid" | "table";

function memberName(u: { firstName: string; lastName: string; email: string }) {
  return `${u.firstName} ${u.lastName}`.trim() || u.email;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

// Icon mapper for cards to add visual flair
const CATEGORY_ICONS = [Terminal, Cpu, Store, Layers, Sparkles, FolderKanban];
const COLOR_ACCENTS = [
  "bg-info/10 text-info border-info/20",
  "bg-brand/10 text-brand border-brand/20",
  "bg-warning/10 text-warning border-warning/20",
  "bg-success/10 text-success border-success/20",
];

function getCategoryIcon(index: number) {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}

function getColorAccent(index: number) {
  return COLOR_ACCENTS[index % COLOR_ACCENTS.length];
}

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

  async function openDetail(team: Team) {
    try {
      const res = await api.getTeam(team.id);
      setDetailSheet({ team, detail: res.data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    }
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
  const filteredAndSortedTeams = useMemo(() => {
    if (!result?.data) return [];
    let list = [...result.data];

    // Filter by department
    if (departmentFilter) {
      list = list.filter((t) => t.departmentId === departmentFilter);
    }

    // Filter by status (Active if member count > 0, else Inactive)
    if (statusFilter === "active") {
      list = list.filter((t) => (t._count?.members ?? 0) > 0);
    } else if (statusFilter === "inactive") {
      list = list.filter((t) => (t._count?.members ?? 0) === 0);
    }

    // Sort
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
  }, [result?.data, departmentFilter, statusFilter, sortBy]);

  const activeCount = useMemo(() => {
    return result?.data.filter((t) => (t._count?.members ?? 0) > 0).length ?? 0;
  }, [result?.data]);

  const inactiveCount = useMemo(() => {
    return result?.data.filter((t) => (t._count?.members ?? 0) === 0).length ?? 0;
  }, [result?.data]);

  return (
    <div className="space-y-3">
      {/* Page Header & Top Actions */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl font-heading">
              Teams
            </h1>
            <Link href="/departments">
              <Button variant="outline" size="xs" className="gap-1 text-xs text-text-secondary h-7 px-2">
                <Building2 className="h-3.5 w-3.5" />
                Departments
              </Button>
            </Link>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Manage organizational groups, team members, and departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              aria-label="Sort teams"
              className="h-8 appearance-none rounded-md border border-border-base bg-surface pl-2.5 pr-7 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="members-desc">Sort: Most Members</option>
              <option value="projects-desc">Sort: Most Projects</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          </div>

          {/* New Team Button */}
          {perms.create && (
            <Button
              onClick={() => setFormSheet("create")}
              size="sm"
              className="gap-1 shadow-2xs h-8 text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5" /> New Team
            </Button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Controls Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border-base pb-2.5">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-brand text-white shadow-2xs"
                : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
            }`}
          >
            All ({result?.data.length ?? 0})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
              statusFilter === "active"
                ? "bg-success text-white shadow-2xs"
                : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
              statusFilter === "inactive"
                ? "bg-neutral-600 text-white shadow-2xs"
                : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        {/* Search, Department Filter & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative max-w-xs flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          {/* Department Filter Select */}
          <select
            aria-label="Filter by department"
            className="h-8 rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* View Switcher Toggle Buttons */}
          <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`rounded-xs p-1 text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              className={`rounded-xs p-1 text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        viewMode === "grid" ? (
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
        )
      ) : filteredAndSortedTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-base py-8 text-center bg-surface">
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
        </div>
      ) : viewMode === "grid" ? (
        /* Rich & Compact Card Grid View with Increased Truncate Limit & See More Link */
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedTeams.map((team, idx) => {
            const IconComponent = getCategoryIcon(idx);
            const accentClass = getColorAccent(idx);
            const memberCount = team._count?.members ?? 0;
            const projectCount = team._count?.projects ?? 0;
            const isActive = memberCount > 0;

            return (
              <Card
                key={team.id}
                className="group relative overflow-hidden rounded-lg border border-border-base bg-surface p-3.5 transition-all duration-200 hover:border-brand/30 hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Header Row: Icon, Team Name, Department, Action Dropdown */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${accentClass}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-text-primary transition-colors group-hover:text-brand font-heading text-sm line-clamp-1 leading-snug">
                          {team.name}
                        </h3>
                        <p className="text-[11px] text-text-tertiary line-clamp-1">
                          {team.department?.name ?? "No Department"}
                        </p>
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Team actions"
                          className="text-text-tertiary hover:text-text-primary hover:bg-surface-subtle rounded-md h-6 w-6 shrink-0"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openDetail(team)} className="gap-1.5 text-xs cursor-pointer">
                          <UsersRound className="h-3.5 w-3.5 text-text-tertiary" /> View Roster
                        </DropdownMenuItem>
                        {perms.update && (
                          <DropdownMenuItem onClick={() => setFormSheet({ edit: team })} className="gap-1.5 text-xs cursor-pointer">
                            <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Team
                          </DropdownMenuItem>
                        )}
                        {perms.delete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(team)}
                              variant="destructive"
                              className="gap-1.5 text-xs cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Team
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Rendered Rich Description with Increased Truncate Limit (line-clamp-3) & See More Link */}
                  <div className="min-h-[2.5rem] mb-2.5">
                    <div className="line-clamp-3 overflow-hidden">
                      <RichTextViewer content={team.description} />
                    </div>
                    {team.description && team.description.length > 80 && (
                      <button
                        onClick={() => openDetail(team)}
                        className="mt-0.5 text-[10px] font-medium text-brand hover:underline inline-flex items-center gap-0.5"
                      >
                        See full description &rarr;
                      </button>
                    )}
                  </div>

                  {/* Status & Stat Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium border ${
                        isActive
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-surface-subtle text-text-tertiary border-border-base"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-success" : "bg-text-tertiary"
                        }`}
                      />
                      {isActive ? "Active" : "Inactive"}
                    </span>

                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <UsersRound className="h-3.5 w-3.5 text-text-tertiary" />
                        {memberCount} {memberCount === 1 ? "Member" : "Members"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5 text-text-tertiary" />
                        {projectCount} {projectCount === 1 ? "Project" : "Projects"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Department Tag & Action Link */}
                <div className="pt-2.5 border-t border-border-base flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                    <Building2 className="h-3.5 w-3.5 text-text-tertiary" />
                    {team.department?.code || "DEPT"}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetail(team)}
                    className="text-xs h-6 px-2 text-brand hover:text-brand-hover hover:bg-brand-soft gap-1 font-medium"
                  >
                    Manage Roster &rarr;
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="rounded-lg border border-border-base bg-surface shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle/50">
                <TableHead className="font-semibold text-text-primary text-xs">Team</TableHead>
                <TableHead className="font-semibold text-text-primary text-xs">Department</TableHead>
                <TableHead className="font-semibold text-text-primary text-xs">Status</TableHead>
                <TableHead className="font-semibold text-text-primary text-xs">Members</TableHead>
                <TableHead className="font-semibold text-text-primary text-xs">Projects</TableHead>
                <TableHead className="text-right font-semibold text-text-primary text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTeams.map((team, idx) => {
                const memberCount = team._count?.members ?? 0;
                const projectCount = team._count?.projects ?? 0;
                const isActive = memberCount > 0;
                const IconComponent = getCategoryIcon(idx);
                const accentClass = getColorAccent(idx);

                return (
                  <TableRow key={team.id} className="hover:bg-surface-subtle/40">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${accentClass}`}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-text-primary font-heading text-xs">
                            {team.name}
                          </span>
                          {team.description ? (
                            <div className="line-clamp-1 text-[11px]">
                              <RichTextViewer content={team.description} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      {team.department ? (
                        <Badge variant="outline" className="text-[11px] font-normal rounded-xs px-1.5 py-0">
                          {team.department.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-tertiary">&mdash;</span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium border ${
                          isActive
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-surface-subtle text-text-tertiary border-border-base"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-success" : "bg-text-tertiary"
                          }`}
                        />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <UsersRound className="h-3.5 w-3.5 text-text-tertiary" />
                        {memberCount}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5 text-text-tertiary" />
                        {projectCount}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Actions"
                            className="text-text-tertiary hover:text-text-primary rounded-md h-6 w-6"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openDetail(team)} className="gap-1.5 text-xs cursor-pointer">
                            <UsersRound className="h-3.5 w-3.5 text-text-tertiary" /> View Roster
                          </DropdownMenuItem>
                          {perms.update && (
                            <DropdownMenuItem onClick={() => setFormSheet({ edit: team })} className="gap-1.5 text-xs cursor-pointer">
                              <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Team
                            </DropdownMenuItem>
                          )}
                          {perms.delete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(team)}
                                variant="destructive"
                                className="gap-1.5 text-xs cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Team
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Bar */}
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

      {/* Create / Edit Team Sidebar Drawer (Sheet) */}
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
    </div>
  );
}

/* Sidebar Drawer Sheet for Create / Edit Team with Tiptap RichTextEditor */
function TeamFormSheet({
  team,
  departments,
  onClose,
  onSaved,
}: {
  team: Team | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: team?.name ?? "",
    description: team?.description ?? "",
    departmentId: team?.departmentId ?? departments[0]?.id ?? "",
  }));

  useEffect(() => {
    if (!form.departmentId && departments[0]) {
      setForm((f) => ({ ...f, departmentId: departments[0].id }));
    }
  }, [departments, form.departmentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (team) {
        await api.updateTeam(team.id, {
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team updated successfully");
      } else {
        await api.createTeam({
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save team");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-surface">
        <SheetHeader className="p-3 border-b border-border-base bg-surface-subtle/30">
          <div className="pr-6">
            <SheetTitle className="font-heading text-sm font-bold text-text-primary">
              {team ? "Edit Team" : "Create New Team"}
            </SheetTitle>
            <SheetDescription className="text-[10px] text-text-tertiary mt-0.5">
              {team
                ? "Update team details, rich description, and department assignment."
                : "Create a new functional team within a department."}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-y-auto p-3 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sheet-name" className="text-xs font-semibold text-text-primary">
              Team Name
            </Label>
            <Input
              id="sheet-name"
              required
              placeholder="e.g. Python Core, Mobile Development"
              className="text-xs h-8"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sheet-departmentId" className="text-xs font-semibold text-text-primary">
              Department
            </Label>
            <select
              id="sheet-departmentId"
              required
              className="h-8 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              {departments.length === 0 && <option value="">Loading departments...</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Package-Based Rich Text Editor (Tiptap) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-primary">
              Rich Description Editor
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(htmlValue) => setForm({ ...form, description: htmlValue })}
              placeholder="Write rich team description with bold, italic, headings, lists, quotes..."
            />
          </div>

          <div className="mt-auto pt-3 border-t border-border-base flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving} className="text-xs h-7">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !form.departmentId} className="text-xs h-7">
              {saving ? "Saving..." : team ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* Sidebar Drawer (Sheet) for Team Roster & Roster Management with RBAC & Full Description Scroll View */
function TeamDetailSheet({
  team,
  detail,
  canManageMembers,
  canManageLeads,
  onClose,
  onChanged,
}: {
  team: Team;
  detail: TeamDetail;
  canManageMembers: boolean;
  canManageLeads: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [asTeamLead, setAsTeamLead] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listUsers(1, 100)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, []);

  const memberIds = new Set(detail.members.map((m) => m.user.id));
  const addable = users.filter((u) => !memberIds.has(u.id));

  async function addMember() {
    if (!selectedUserId) return;
    setBusy(true);
    try {
      // 1. Add member (requires manage_members permission)
      await api.addTeamMember({ teamId: team.id, userId: selectedUserId });
      
      // 2. If user selected TL and has manage_leads permission, set lead status
      if (asTeamLead && canManageLeads) {
        await api.updateTeamMember(team.id, selectedUserId, { isTeamLead: true });
        toast.success("Member added and designated as Team Lead");
      } else {
        toast.success("Member added to team");
      }

      setSelectedUserId("");
      setAsTeamLead(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function setLead(userId: string, isTeamLead: boolean) {
    if (!canManageLeads) {
      toast.error("You do not have permission to manage team leads");
      return;
    }
    setBusy(true);
    try {
      await api.updateTeamMember(team.id, userId, { isTeamLead });
      toast.success(isTeamLead ? "Designated as Team Lead" : "Removed Team Lead status");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead status");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!canManageMembers) {
      toast.error("You do not have permission to remove members");
      return;
    }
    if (!window.confirm("Remove this member from the team?")) return;
    setBusy(true);
    try {
      await api.removeTeamMember(team.id, userId);
      toast.success("Member removed from team");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-surface">
        <SheetHeader className="p-3 border-b border-border-base bg-surface-subtle/30">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div>
              <SheetTitle className="font-heading text-sm font-bold text-text-primary">
                {team.name}
              </SheetTitle>
              <SheetDescription className="text-[10px] text-text-tertiary mt-0.5">
                {team.department?.name ?? "No Department"} &bull; {detail.members.length}{" "}
                {detail.members.length === 1 ? "member" : "members"}
              </SheetDescription>
            </div>
            {team.department && (
              <Badge variant="outline" className="text-[9px] font-normal rounded-xs px-1.5 py-0">
                {team.department.name}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Scrollable Full Rich Team Description Box */}
          {team.description && (
            <div className="rounded-md border border-border-base bg-surface p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  <FileText className="h-3 w-3 text-brand" /> Full Rich Description
                </div>
                <span className="text-[9px] text-text-tertiary">Scroll view</span>
              </div>
              <div className="max-h-40 overflow-y-auto pr-1">
                <RichTextViewer content={team.description} />
              </div>
            </div>
          )}

          {/* Add Member Controls with RBAC */}
          {canManageMembers ? (
            <div className="space-y-1.5 rounded-md border border-border-base bg-surface-subtle/40 p-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-member-select-sheet" className="text-xs font-semibold text-text-primary flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5 text-brand" /> Add Team Member
                </Label>
                <span className="text-[10px] text-text-tertiary font-medium">RBAC Enabled</span>
              </div>

              <div className="space-y-1.5">
                <select
                  id="add-member-select-sheet"
                  className="h-7.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select organization user...</option>
                  {addable.map((u) => (
                    <option key={u.id} value={u.id}>
                      {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                      {u.designation ? ` (${u.designation})` : ""}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between pt-0.5">
                  {/* TL Toggle option if user has lead management permission */}
                  {canManageLeads ? (
                    <label className="flex items-center gap-1 cursor-pointer text-xs text-text-secondary select-none">
                      <input
                        type="checkbox"
                        checked={asTeamLead}
                        onChange={(e) => setAsTeamLead(e.target.checked)}
                        className="rounded-xs border-border-base text-brand focus:ring-brand h-3.5 w-3.5"
                      />
                      <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Crown className="h-3 w-3" /> Add as Team Lead (TL)
                      </span>
                    </label>
                  ) : (
                    <span className="text-[10px] text-text-tertiary italic flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Member Role
                    </span>
                  )}

                  <Button
                    size="sm"
                    onClick={addMember}
                    disabled={!selectedUserId || busy}
                    className="gap-1 h-7 text-xs px-3 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Member
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border-base bg-surface-subtle/30 p-2 text-xs text-text-tertiary text-center">
              You have read-only access to team roster.
            </div>
          )}

          {/* Members List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                Team Roster ({detail.members.length})
              </h4>
            </div>

            {detail.members.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-base py-5 text-center text-xs text-text-tertiary">
                No members assigned to this team yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {detail.members.map((m) => {
                  const name = memberName(m.user);
                  const initials = getInitials(name);

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md border border-border-base bg-surface p-2 transition-colors hover:border-border-strong"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-xs text-brand border border-brand/20">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {name}
                            </span>
                            {m.isTeamLead && (
                              <span className="inline-flex items-center gap-0.5 rounded-xs bg-amber-500/10 px-1 py-0.1 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                <Crown className="h-2.5 w-2.5" /> TL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-tertiary truncate">
                            {m.user.email}
                            {m.user.designation ? ` \u2022 ${m.user.designation}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {canManageLeads && (
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={busy}
                            onClick={() => setLead(m.user.id, !m.isTeamLead)}
                            className={`text-[10px] h-6 px-1.5 ${
                              m.isTeamLead
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-text-tertiary hover:text-text-primary"
                            }`}
                          >
                            {m.isTeamLead ? "Demote TL" : "Make TL"}
                          </Button>
                        )}
                        {canManageMembers && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Remove member"
                            className="text-text-tertiary hover:text-error hover:bg-error/10 h-6 w-6"
                            disabled={busy}
                            onClick={() => removeMember(m.user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-2.5 border-t border-border-base bg-surface-subtle/20">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full text-xs h-7">
            Close Panel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}