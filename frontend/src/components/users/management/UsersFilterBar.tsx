"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Department, Role } from "@/lib/api";

interface UsersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  roles: Role[];
  departments: Department[];
  onClearFilters: () => void;
}

export function UsersFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  statusFilter,
  onStatusFilterChange,
  roles,
  departments,
  onClearFilters,
}: UsersFilterBarProps) {
  const hasActiveFilters = Boolean(search || roleFilter || departmentFilter || statusFilter);

  return (
    <Card className="p-4 border border-border-base bg-surface shadow-2xs rounded-xl">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            className="pl-9 text-xs h-9 bg-surface-subtle/50"
            placeholder="Search users by name, email, employee ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none min-w-[130px]"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
          >
            <option value="">Role: All</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none min-w-[130px]"
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
          >
            <option value="">Dept: All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-medium text-text-primary shadow-2xs focus:border-brand focus:outline-none min-w-[130px]"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-9 text-brand hover:bg-brand/10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
