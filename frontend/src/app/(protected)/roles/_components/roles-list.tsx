"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Search,
  List,
  LayoutGrid,
  Shield,
  MoreVertical,
  KeyRound,
  Pencil,
  Trash2,
} from "lucide-react";
import { roleBadgeClass } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api";
import { getRoleAvatarColor, getRoleInitials, type ViewMode } from "./role-helpers";
import { fadeInUp, staggerContainer } from "./motion";

export function RolesList({
  roles,
  loading,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedRole,
  onSelectRole,
  canManage,
  onEdit,
  onDelete,
}: {
  roles: Role[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  canManage: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  return (
    <div className="flex flex-col bg-surface rounded-xl border border-border-base shadow-2xs overflow-hidden">
      {/* Header Controls Bar */}
      <div className="p-3 border-b border-border-base flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-surface-subtle/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary font-heading text-sm">
            Organizational Roles
          </h3>
          <span className="text-[11px] text-text-tertiary">({roles.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <Input
              className="h-7.5 pl-8 text-xs"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
            <button
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
              className={cn(
                "rounded-xs p-1 text-xs transition-colors",
                viewMode === "list"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
              className={cn(
                "rounded-xs p-1 text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Roles Content */}
      <div className="p-2 space-y-1.5 min-h-[420px] max-h-[calc(100vh-250px)] overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 border border-border-base rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          ))
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Shield className="h-8 w-8 text-text-tertiary mb-2" />
            <p className="text-xs text-text-tertiary">No roles found matching criteria.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "list" ? (
              <motion.div
                key="list"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                className="space-y-1.5"
              >
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const initials = getRoleInitials(role.displayName, role.name);
                  const avatarStyle = getRoleAvatarColor(role.name, role.isSpecial, role.isSystem);
                  const userCount = role._count?.users ?? 0;
                  const permCount = role.isSpecial
                    ? "Full Access (All permissions)"
                    : `${role.permissionKeys?.length ?? 0} Permissions granted`;

                  return (
                    <motion.div
                      key={role.id}
                      variants={fadeInUp}
                      onClick={() => onSelectRole(role)}
                      className={cn(
                        "group relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer overflow-hidden select-none",
                        isSelected
                          ? "bg-surface-container border-brand/30 shadow-2xs"
                          : "bg-surface hover:bg-surface-subtle/60 border-border-base"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId={`role-accent-${role.id}`}
                          className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-l-lg"
                        />
                      )}

                      <div className="flex items-center gap-3 pl-1 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                            avatarStyle
                          )}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-text-primary text-xs font-heading truncate">
                              {role.displayName}
                            </h4>
                            <span
                              className={cn(
                                "px-1.5 py-0.2 text-[10px] font-mono rounded-xs border uppercase",
                                roleBadgeClass(role.name)
                              )}
                            >
                              {role.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                            {role.description || permCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex flex-col items-end text-right">
                          <span className="text-[10px] text-text-tertiary font-medium">Assigned To</span>
                          <span className="text-xs font-semibold text-text-primary">
                            {userCount} {userCount === 1 ? "User" : "Users"}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-xs text-[10px] font-semibold border uppercase tracking-wider",
                            role.isSpecial
                              ? "bg-primary-container text-on-primary-container border-primary/20"
                              : role.isSystem
                              ? "bg-surface-subtle text-text-secondary border-border-base"
                              : "bg-success/10 text-success border-success/20"
                          )}
                        >
                          {role.isSpecial ? "Special" : role.isSystem ? "System" : "Active"}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Role actions"
                              className="text-text-tertiary hover:text-text-primary rounded-md h-6 w-6"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => onSelectRole(role)}
                              className="gap-1.5 text-xs cursor-pointer"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-text-tertiary" /> Matrix View
                            </DropdownMenuItem>

                            {canManage && !role.isSystem && (
                              <DropdownMenuItem
                                onClick={() => onEdit(role)}
                                className="gap-1.5 text-xs cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Role &amp; Matrix
                              </DropdownMenuItem>
                            )}

                            {canManage && !role.isSystem && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(role)}
                                  variant="destructive"
                                  className="gap-1.5 text-xs cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete Role
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const initials = getRoleInitials(role.displayName, role.name);
                  const avatarStyle = getRoleAvatarColor(role.name, role.isSpecial, role.isSystem);
                  const userCount = role._count?.users ?? 0;

                  return (
                    <motion.div key={role.id} variants={fadeInUp} whileHover={{ y: -2 }}>
                      <Card
                        onClick={() => onSelectRole(role)}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden h-full",
                          isSelected
                            ? "bg-surface-container border-brand/40 shadow-xs"
                            : "bg-surface hover:border-brand/20 border-border-base"
                        )}
                      >
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />}

                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                                  avatarStyle
                                )}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-text-primary text-xs font-heading truncate">
                                  {role.displayName}
                                </h4>
                                <span className="text-[10px] font-mono text-text-tertiary">
                                  {role.name}
                                </span>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded-xs text-[9px] font-semibold border uppercase tracking-wider shrink-0",
                                role.isSpecial
                                  ? "bg-primary-container text-on-primary-container border-primary/20"
                                  : role.isSystem
                                  ? "bg-surface-subtle text-text-secondary border-border-base"
                                  : "bg-success/10 text-success border-success/20"
                              )}
                            >
                              {role.isSpecial ? "Special" : role.isSystem ? "System" : "Active"}
                            </span>
                          </div>

                          <p className="text-xs text-text-secondary line-clamp-2 min-h-[1.8rem] mb-2 leading-relaxed">
                            {role.description || "Custom role permissions configuration."}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border-base flex items-center justify-between text-xs text-text-secondary">
                          <span className="text-[11px] text-text-tertiary">
                            {userCount} {userCount === 1 ? "User" : "Users"}
                          </span>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRole(role);
                            }}
                            className="text-[11px] h-6 px-2 text-brand font-medium gap-1"
                          >
                            Configure Matrix &rarr;
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}