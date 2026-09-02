"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Grid, List, Search } from "lucide-react";

interface DepartmentsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  viewMode: "grid" | "table";
  onToggleViewMode: (mode: "grid" | "table") => void;
  totalCount: number;
}

export function DepartmentsFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onToggleSort,
  viewMode,
  onToggleViewMode,
  totalCount,
}: DepartmentsFilterBarProps) {
  return (
    <div className="space-y-3">
      <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                className="pl-9 text-xs h-9 bg-surface-subtle/50"
                placeholder="Search departments..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none min-w-[130px]"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSort}
              className="gap-1.5 text-xs h-9"
            >
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}
            </Button>

            <div className="flex items-center border border-border-base rounded-md p-0.5 bg-surface-subtle">
              <button
                type="button"
                onClick={() => onToggleViewMode("grid")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "grid" ? "bg-surface text-brand shadow-2xs font-bold" : "text-text-tertiary hover:text-text-primary"
                }`}
                title="Bento Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleViewMode("table")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "table" ? "bg-surface text-brand shadow-2xs font-bold" : "text-text-tertiary hover:text-text-primary"
                }`}
                title="Table List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
        <span>Showing {totalCount} departments</span>
      </div>
    </div>
  );
}
