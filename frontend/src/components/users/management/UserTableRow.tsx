"use client";

import { motion } from "framer-motion";
import { User, UserStatus } from "@/lib/api";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, RotateCcw, Trash2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  canDelete: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (u: User) => void;
  onResetPassword: (u: User) => void;
  onStatusChange: (u: User, status: UserStatus) => void;
  onDelete: (u: User) => void;
}

function displayName(u: User): string {
  return (
    u.name?.trim() ||
    [u.firstName, u.lastName].filter((p): p is string => Boolean(p)).join(" ") ||
    u.email
  );
}

function roleName(u: User): string {
  return typeof u.role === "string" ? u.role : u.role.displayName || u.role.name;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getRoleBadgeStyle(roleNameStr: string): string {
  const r = roleNameStr.toLowerCase();
  if (r.includes("superadmin") || r.includes("admin")) {
    return "bg-brand/10 text-brand border border-brand/30 font-bold";
  }
  if (r.includes("lead") || r.includes("manager")) {
    return "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 font-semibold";
  }
  return "bg-surface-subtle text-text-secondary border border-border-base";
}

export function UserTableRow({
  user,
  isSelected,
  canDelete,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onStatusChange,
  onDelete,
}: UserTableRowProps) {
  const nameStr = displayName(user);
  const roleStr = roleName(user);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "hover:bg-surface-subtle/40 transition-colors group border-b border-border-base/50",
        isSelected && "bg-brand/5"
      )}
    >
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer"
        />
      </TableCell>

      {/* Name & Email */}
      <TableCell>
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={nameStr}
              className="w-9 h-9 rounded-full object-cover border border-border-base shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs border border-brand/20 shrink-0 font-mono">
              {getInitials(nameStr)}
            </div>
          )}
          <div>
            <p className="font-semibold text-xs text-text-primary font-heading flex items-center gap-1.5">
              {nameStr}
              {user.employeeId && (
                <span className="text-[10px] font-mono font-normal text-text-tertiary bg-surface-subtle px-1.5 py-0.5 rounded">
                  {user.employeeId}
                </span>
              )}
            </p>
            <p className="text-[11px] text-text-tertiary">{user.email}</p>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell>
        <Badge
          variant="secondary"
          className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", getRoleBadgeStyle(roleStr))}
        >
          {roleStr}
        </Badge>
      </TableCell>

      {/* Department */}
      <TableCell className="text-xs text-text-secondary font-medium">
        {user.department?.name || "—"}
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusPill status={user.status} />
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-text-tertiary hover:text-text-primary"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(user)}>
              <RotateCcw className="h-3.5 w-3.5 mr-2 text-info" /> Reset Password
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {user.status !== "ACTIVE" && (
              <DropdownMenuItem onClick={() => onStatusChange(user, "ACTIVE")}>
                <UserCheck className="h-3.5 w-3.5 mr-2 text-success" /> Mark Active
              </DropdownMenuItem>
            )}
            {user.status !== "INACTIVE" && (
              <DropdownMenuItem onClick={() => onStatusChange(user, "INACTIVE")}>
                <UserCheck className="h-3.5 w-3.5 mr-2 text-text-tertiary" /> Mark Inactive
              </DropdownMenuItem>
            )}
            {user.status !== "SUSPENDED" && (
              <DropdownMenuItem onClick={() => onStatusChange(user, "SUSPENDED")}>
                <UserCheck className="h-3.5 w-3.5 mr-2 text-warning" /> Suspend Account
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-error focus:text-error"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Soft Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium border border-warning/20">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-subtle text-text-tertiary text-xs font-medium border border-border-base">
      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
      Inactive
    </span>
  );
}
