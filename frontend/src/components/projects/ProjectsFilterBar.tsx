"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, LayoutGrid, List, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProjectStatus, ProjectPriority } from "@/lib/api";

interface ProjectsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  viewMode: "grid" | "table";
  onToggleViewMode: (v: "grid" | "table") => void;
  totalCount: number;
  activeCount: number;
  planningCount: number;
  completedCount: number;
}

export function ProjectsFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOrder,
  onToggleSort,
  viewMode,
  onToggleViewMode,
  totalCount,
  activeCount,
  planningCount,
  completedCount,
}: ProjectsFilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border-base pb-2.5"
    >
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
        <button
          onClick={() => onStatusFilterChange("")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer ${
            !statusFilter
              ? "bg-brand text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => onStatusFilterChange("ACTIVE")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer ${
            statusFilter === "ACTIVE"
              ? "bg-success text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => onStatusFilterChange("PLANNING")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer ${
            statusFilter === "PLANNING"
              ? "bg-info text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          Planning ({planningCount})
        </button>
        <button
          onClick={() => onStatusFilterChange("COMPLETED")}
          className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-purple-600 text-white shadow-2xs"
              : "bg-surface-subtle text-text-secondary hover:bg-surface-muted border border-border-base"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative max-w-xs flex-1 sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            className="h-8 pl-8 text-xs bg-surface"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select
          aria-label="Filter by priority"
          className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none"
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Sort Selector */}
        <button
          type="button"
          onClick={onToggleSort}
          className="h-8 px-2.5 rounded-md border border-border-base bg-surface text-xs font-medium text-text-primary shadow-2xs hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-text-tertiary" />
          Sort: Name ({sortOrder === "asc" ? "A-Z" : "Z-A"})
        </button>

        {/* View Mode Toggle Tabs */}
        <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
          <button
            onClick={() => onToggleViewMode("grid")}
            aria-label="Grid view"
            className={`rounded-md p-1.5 text-xs transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-brand text-white shadow-2xs font-bold"
                : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleViewMode("table")}
            aria-label="Table view"
            className={`rounded-md p-1.5 text-xs transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-brand text-white shadow-2xs font-bold"
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
