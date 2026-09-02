"use client";

import { motion } from "framer-motion";
import { User, UserStatus, apiFileUrl } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
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

function StatusPill({ status }: { status?: string }) {
  const s = (status || "ACTIVE").toUpperCase();
  if (s === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/30">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Active
      </span>
    );
  }
  if (s === "INACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error/10 text-error border border-error/30">
      <span className="w-1.5 h-1.5 rounded-full bg-error" />
      Suspended
    </span>
  );
}

export function UserCard({
  user,
  isSelected,
  canDelete,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onStatusChange,
  onDelete,
}: UserCardProps) {
  const nameStr = displayName(user);
  const roleStr = roleName(user);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "p-5 border border-border-base bg-surface rounded-xl shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between group",
          isSelected && "border-brand bg-brand/5 ring-1 ring-brand"
        )}
      >
        {/* Top bar with Checkbox and Actions Menu */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(user.id)}
            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer"
          />

          <div className="flex items-center gap-2">
            <StatusPill status={user.status} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-text-tertiary hover:text-text-primary"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(user)} className="cursor-pointer text-xs">
                  <Pencil className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
                  Edit User Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResetPassword(user)} className="cursor-pointer text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
                  Reset Password
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {user.status !== "ACTIVE" && (
                  <DropdownMenuItem onClick={() => onStatusChange(user, "ACTIVE")} className="cursor-pointer text-xs text-success">
                    <UserCheck className="h-3.5 w-3.5 mr-2" />
                    Activate User
                  </DropdownMenuItem>
                )}
                {user.status === "ACTIVE" && (
                  <DropdownMenuItem onClick={() => onStatusChange(user, "INACTIVE")} className="cursor-pointer text-xs text-warning">
                    <UserCheck className="h-3.5 w-3.5 mr-2" />
                    Deactivate User
                  </DropdownMenuItem>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(user)} className="cursor-pointer text-xs text-error focus:text-error">
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center: Profile Picture & Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            {user.avatarUrl ? (
              <img
                src={apiFileUrl(user.avatarUrl)}
                alt={nameStr}
                className="w-16 h-16 rounded-full object-cover border-2 border-border-base shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg border border-brand/20 shadow-2xs font-mono">
                {getInitials(nameStr)}
              </div>
            )}
          </div>

          <h3 className="font-heading text-sm font-bold text-text-primary tracking-tight">
            {nameStr}
          </h3>

          <p className="text-[11px] text-text-tertiary mt-0.5 truncate max-w-[200px]">
            {user.email}
          </p>

          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap justify-center">
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", getRoleBadgeStyle(roleStr))}
            >
              {roleStr}
            </Badge>

            {user.employeeId && (
              <span className="text-[10px] font-mono font-medium text-text-secondary bg-surface-subtle px-1.5 py-0.5 rounded border border-border-base">
                {user.employeeId}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Details (Department, Designation, Actions) */}
        <div className="pt-3 border-t border-border-base/60 space-y-1.5 text-xs text-text-secondary">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-tertiary flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Dept
            </span>
            <span className="font-medium text-text-primary truncate max-w-[130px]">
              {user.department?.name || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-tertiary">Role / Title</span>
            <span className="font-medium text-text-primary truncate max-w-[130px]">
              {user.designation || "—"}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
