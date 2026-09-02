"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, ChevronDown, Download, UserCheck, UserPlus } from "lucide-react";
import { UserStatus } from "@/lib/api";
import { UsersDraftsDropdown } from "./UsersDraftsDropdown";

interface UsersHeaderProps {
  totalCount: number;
  selectedCount: number;
  canCreate: boolean;
  onBulkStatusChange: (status: UserStatus) => void;
  onExportCSV: () => void;
}

export function UsersHeader({
  totalCount,
  selectedCount,
  canCreate,
  onBulkStatusChange,
  onExportCSV,
}: UsersHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl font-heading flex items-center gap-3">
          Users Management
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={totalCount}
            className="text-xs font-semibold bg-brand/10 text-brand px-2.5 py-1 rounded-full font-mono"
          >
            {totalCount}
          </motion.span>
        </h1>
        <p className="text-xs text-text-tertiary mt-1">
          Manage system users, department roles, and access permissions.
        </p>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {/* Bulk Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedCount === 0}
              className="gap-1.5 text-xs h-9 transition-all"
            >
              <CheckSquare className="h-4 w-4" /> Bulk Actions ({selectedCount})
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Bulk Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkStatusChange("ACTIVE")}>
              <UserCheck className="h-3.5 w-3.5 mr-2 text-success" /> Set Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusChange("INACTIVE")}>
              <UserCheck className="h-3.5 w-3.5 mr-2 text-text-tertiary" /> Set Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusChange("SUSPENDED")}>
              <UserCheck className="h-3.5 w-3.5 mr-2 text-warning" /> Set Suspended
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          className="gap-1.5 text-xs h-9"
        >
          <Download className="h-4 w-4" /> Export
        </Button>

        {/* Saved Drafts Dropdown (load / continue / delete) */}
        {canCreate && <UsersDraftsDropdown />}

        {/* Add User Wizard Button */}
        {canCreate && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              onClick={() => router.push("/users/create")}
              className="gap-1.5 text-xs h-9 shadow-2xs bg-brand hover:bg-brand-hover text-white font-medium"
            >
              <UserPlus className="h-4 w-4" /> Add User
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
