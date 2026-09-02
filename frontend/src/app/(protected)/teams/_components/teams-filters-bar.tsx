"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Department } from "@/lib/api";
import type { SortOption, StatusFilter, ViewMode } from "./team-helpers";
import { fadeInUp } from "./motion";

export function TeamsFiltersBar({
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  departments,
  departmentFilter,
  onDepartmentFilterChange,
  viewMode,
  onViewModeChange,
  totalCount,
  activeCount,
  inactiveCount,
}: {
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  departments: Department[];
  departmentFilter: string;
  onDepartmentFilterChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border-base pb-2.5"
    >
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
        <button
          onClick={() => onStatusFilterChange("all")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
            statusFilter === "all"
              ? "bg-brand text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => onStatusFilterChange("active")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
            statusFilter === "active"
              ? "bg-success text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => onStatusFilterChange("inactive")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all ${
            statusFilter === "inactive"
              ? "bg-neutral-600 text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1 sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          aria-label="Sort teams"
          className="h-8 appearance-none rounded-md border border-border-base bg-surface pl-2.5 pr-7 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="name-asc">Sort: Name (A-Z)</option>
          <option value="name-desc">Sort: Name (Z-A)</option>
          <option value="members-desc">Sort: Most Members</option>
          <option value="projects-desc">Sort: Most Projects</option>
        </select>
        <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />

        <select
          aria-label="Filter by department"
          className="h-8 rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
          value={departmentFilter}
          onChange={(e) => onDepartmentFilterChange(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
          <button
            onClick={() => onViewModeChange("grid")}
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
            onClick={() => onViewModeChange("table")}
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
    </motion.div>
  );
}