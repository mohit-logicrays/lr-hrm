"use client";

import { useCallback, useEffect, useState, FormEvent, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { api, PermissionGroups, Role } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { roleBadgeClass } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  MoreVertical,
  LayoutGrid,
  List,
  Shield,
  Download,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  UserCheck,
  Building2,
  FolderKanban,
  Calendar,
  Clock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

// Helper to generate initials from role name or display name
function getRoleInitials(displayName: string, name: string): string {
  if (name.toLowerCase() === "super_admin" || name.toLowerCase() === "admin") return "SA";
  if (name.toLowerCase() === "hr" || displayName.toLowerCase().includes("hr")) return "HR";
  if (name.toLowerCase() === "manager" || displayName.toLowerCase().includes("manager")) return "MG";
  if (name.toLowerCase() === "team_lead" || displayName.toLowerCase().includes("lead")) return "TL";
  if (name.toLowerCase() === "member" || displayName.toLowerCase().includes("member")) return "TM";

  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

// Avatar color accent generator for roles
function getRoleAvatarColor(name: string, isSpecial?: boolean, isSystem?: boolean) {
  if (isSpecial) return "bg-primary-container text-on-primary-container border-primary/30";
  if (name.includes("hr")) return "bg-secondary-container text-on-secondary-container border-secondary/30";
  if (name.includes("manager")) return "bg-info/10 text-info border-info/20";
  if (name.includes("lead")) return "bg-warning/10 text-warning border-warning/20";
  if (isSystem) return "bg-surface-subtle text-text-primary border-border-base";
  return "bg-brand/10 text-brand border-brand/20";
}

// Module Icon Mapper
function getModuleIcon(groupName: string) {
  const name = groupName.toLowerCase();
  if (name.includes("user") || name.includes("employee")) return UsersRound;
  if (name.includes("project") || name.includes("task")) return FolderKanban;
  if (name.includes("team") || name.includes("department")) return Building2;
  if (name.includes("leave") || name.includes("attendance") || name.includes("holiday")) return Calendar;
  if (name.includes("time") || name.includes("schedule")) return Clock;
  return Shield;
}

export default function RolesPage() {
  const rolePerms = usePermission("role");
  const permissionPerms = usePermission("permission");

  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionGroups>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Selected role for right side permission matrix drawer / panel
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Whether the right-side permission matrix panel is expanded or minimized to a vertical tab
  const [matrixExpanded, setMatrixExpanded] = useState(false);

  // Form modal state (Create / Edit role & Configure permissions)
  const [formModalState, setFormModalState] = useState<
    "create" | { edit: Role } | null
  >(null);

  const canManage = rolePerms.manage || rolePerms.update || rolePerms.delete || rolePerms.create;
  const canManagePermissions = permissionPerms.manage || rolePerms.manage;

  // Select a role and expand the right-side matrix panel
  function selectRole(role: Role) {
    setSelectedRole(role);
    setMatrixExpanded(true);
  }

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([api.listRoles(), api.listPermissions()]);
      setRoles(r.data);
      setGroups(p.data);

      setSelectedRole((current) => {
        if (!current && r.data.length > 0) {
          return r.data[0];
        }
        if (current) {
          const updated = r.data.find((role) => role.id === current.id);
          return updated ?? current;
        }
        return current;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(role: Role) {
    if (!window.confirm(`Delete role "${role.displayName}"?`)) return;
    try {
      await api.deleteRole(role.id);
      toast.success("Role deleted");
      if (selectedRole?.id === role.id) setSelectedRole(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  function handleExport() {
    window.open(api.exportRoles(), "_blank");
    toast.success("Exporting roles and permissions CSV...");
  }

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, search]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl font-heading">
              Roles &amp; Permissions
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {roles.length} Roles Configured
            </Badge>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Manage organizational access levels and define capabilities for all users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1 text-xs h-8 px-3 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          {/* Add New Role Button */}
          {canManage && (
            <Button
              onClick={() => setFormModalState("create")}
              size="sm"
              className="gap-1 shadow-2xs h-8 text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Role
            </Button>
          )}
        </div>
      </div>

      {/* Main 7:5 Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Roles List & View Switcher (dynamically sized by matrix panel state) */}
        <div className={cn(
          "flex flex-col bg-surface rounded-xl border border-border-base shadow-2xs overflow-hidden",
          matrixExpanded ? "lg:col-span-7 xl:col-span-7" : "lg:col-span-11 xl:col-span-11"
        )}>
          {/* Header Controls Bar */}
          <div className="p-3 border-b border-border-base flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-surface-subtle/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary font-heading text-sm">
                Organizational Roles
              </h3>
              <span className="text-[11px] text-text-tertiary">({filteredRoles.length})</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative w-44 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <Input
                  className="h-7.5 pl-8 text-xs"
                  placeholder="Search roles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-md border border-border-base bg-surface p-0.5">
                <button
                  onClick={() => setViewMode("list")}
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
                  onClick={() => setViewMode("grid")}
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
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Shield className="h-8 w-8 text-text-tertiary mb-2" />
                <p className="text-xs text-text-tertiary">No roles found matching criteria.</p>
              </div>
            ) : viewMode === "list" ? (
              /* Custom Interactive Rows View */
              filteredRoles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const initials = getRoleInitials(role.displayName, role.name);
                const avatarStyle = getRoleAvatarColor(role.name, role.isSpecial, role.isSystem);
                const userCount = role._count?.users ?? 0;
                const permCount = role.isSpecial
                  ? "Full Access (All permissions)"
                  : `${role.permissionKeys?.length ?? 0} Permissions granted`;

                return (
                  <div
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={cn(
                      "group relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer overflow-hidden select-none",
                      isSelected
                        ? "bg-surface-container border-brand/30 shadow-2xs"
                        : "bg-surface hover:bg-surface-subtle/60 border-border-base"
                    )}
                  >
                    {/* Left Accent Bar for Selected State */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-l-lg" />
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

                      {/* Action Dropdown Menu */}
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
                            onClick={() => selectRole(role)}
                            className="gap-1.5 text-xs cursor-pointer"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-text-tertiary" /> Matrix View
                          </DropdownMenuItem>

                          {canManage && !role.isSystem && (
                            <DropdownMenuItem
                              onClick={() => setFormModalState({ edit: role })}
                              className="gap-1.5 text-xs cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Role &amp; Matrix
                            </DropdownMenuItem>
                          )}

                          {canManage && !role.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(role)}
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
                  </div>
                );
              })
            ) : (
              /* Grid Cards View */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRoles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const initials = getRoleInitials(role.displayName, role.name);
                  const avatarStyle = getRoleAvatarColor(role.name, role.isSpecial, role.isSystem);
                  const userCount = role._count?.users ?? 0;

                  return (
                    <Card
                      key={role.id}
                      onClick={() => selectRole(role)}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden",
                        isSelected
                          ? "bg-surface-container border-brand/40 shadow-xs"
                          : "bg-surface hover:border-brand/20 border-border-base"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                      )}

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
                            selectRole(role);
                          }}
                          className="text-[11px] h-6 px-2 text-brand font-medium gap-1"
                        >
                          Configure Matrix &rarr;
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Permission Matrix Preview Drawer (dynamically sized) */}
        <div className={cn(
          "flex flex-col bg-surface rounded-xl border border-border-base shadow-sm overflow-hidden transition-all",
          matrixExpanded ? "lg:col-span-5 xl:col-span-5 min-h-[500px]" : "lg:col-span-1 xl:col-span-1"
        )}>
          <AnimatePresence mode="wait" initial={false}>
            {matrixExpanded && selectedRole ? (
              <motion.div
                key="matrix-panel"
                className="flex flex-col h-full"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <PermissionMatrixPanel
                  role={selectedRole}
                  groups={groups}
                  canManagePermissions={Boolean(canManagePermissions)}
                  onClose={() => setMatrixExpanded(false)}
                  onSaved={() => {
                    load();
                  }}
                />
              </motion.div>
            ) : selectedRole ? (
              /* Minimized Vertical Tab - click to expand the matrix panel */
              <motion.button
                key="matrix-tab"
                onClick={() => setMatrixExpanded(true)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="group flex flex-col items-center gap-3 py-6 h-full w-full transition-colors hover:bg-surface-subtle/40"
                aria-label="Expand permission matrix"
              >
                <span className="p-2 rounded-lg bg-brand/10 text-brand border border-brand/20 transition-transform group-hover:scale-105">
                  <KeyRound className="h-4 w-4" />
                </span>
                <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold text-text-primary tracking-widest uppercase">
                  Permission Matrix
                </span>
                <span className="mt-auto flex flex-col items-center gap-2 text-text-tertiary">
                  <span className="w-px h-8 bg-border-base" />
                  <span className="text-[9px] font-medium uppercase tracking-wider hidden lg:block">
                    {selectedRole.displayName}
                  </span>
                </span>
              </motion.button>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-max">
                <KeyRound className="h-10 w-10 text-text-tertiary/40 mb-2" />
                <h3 className="font-semibold text-text-primary text-sm font-heading">
                  No Role Selected
                </h3>
                <p className="text-xs text-text-tertiary mt-1 max-w-xs">
                  Select a role from the list on the left to configure or inspect its permission matrix.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comprehensive Modal Dialog for Create Role & Configure Permissions */}
      {formModalState && (
        <CreateRoleAndPermissionsModal
          state={formModalState}
          groups={groups}
          onClose={() => setFormModalState(null)}
          onSaved={() => {
            setFormModalState(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* Side Panel Component for Right-Side Permission Matrix */
function PermissionMatrixPanel({
  role,
  groups,
  canManagePermissions,
  onClose,
  onSaved,
}: {
  role: Role;
  groups: PermissionGroups;
  canManagePermissions: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isLocked = role.isSpecial || role.isSystem;
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(role.permissionKeys ?? [])
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedKeys(new Set(role.permissionKeys ?? []));
  }, [role]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(groups).forEach((g, idx) => {
      initial[g] = idx < 3;
    });
    return initial;
  });

  function toggleGroupAccordion(group: string) {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  function toggleKey(key: string, checked: boolean) {
    if (isLocked || !canManagePermissions) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleAllGroupKeys(keys: string[], checked: boolean) {
    if (isLocked || !canManagePermissions) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => {
        if (checked) next.add(k);
        else next.delete(k);
      });
      return next;
    });
  }

  const allSystemKeys = useMemo(() => {
    const keys: string[] = [];
    Object.values(groups).forEach((list) => {
      list.forEach((p) => keys.push(p.key));
    });
    return keys;
  }, [groups]);

  const isAllSystemSelected = useMemo(() => {
    if (role.isSpecial) return true;
    return allSystemKeys.length > 0 && allSystemKeys.every((k) => selectedKeys.has(k));
  }, [role.isSpecial, allSystemKeys, selectedKeys]);

  function toggleGlobalSelectAll(checked: boolean) {
    if (isLocked || !canManagePermissions) return;
    if (checked) {
      setSelectedKeys(new Set(allSystemKeys));
    } else {
      setSelectedKeys(new Set());
    }
  }

  async function handleSave() {
    if (isLocked || !canManagePermissions) return;
    setSaving(true);
    try {
      await api.setRolePermissions(role.id, [...selectedKeys]);
      toast.success(`Updated permission matrix for ${role.displayName}`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3.5 border-b border-border-base bg-surface-subtle/50 relative overflow-hidden flex items-start justify-between">
        <div className="pr-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={cn(
                "px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider font-semibold border",
                isLocked
                  ? "bg-surface-subtle text-text-secondary border-border-base"
                  : "bg-primary-container text-on-primary-container border-primary/20"
              )}
            >
              {isLocked ? "Read-Only System Mode" : "Interactive Editing Mode"}
            </span>
          </div>
          <h3 className="font-heading font-bold text-text-primary text-sm">
            {role.displayName} Matrix
          </h3>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Configure fine-grained resource permissions &amp; access rights.
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-subtle transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-270px)]">
        <div className="flex items-center justify-between p-3 rounded-lg border border-brand/20 bg-surface-container shadow-2xs">
          <div>
            <span className="font-semibold text-xs text-text-primary block font-heading">
              Full System Access
            </span>
            <span className="text-[10px] text-text-tertiary">
              Grants all current and future system capability permissions.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={isLocked || !canManagePermissions}
              checked={isAllSystemSelected}
              onChange={(e) => toggleGlobalSelectAll(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-base after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
          </label>
        </div>

        <div className="space-y-2">
          {Object.entries(groups).map(([groupName, groupPerms]) => {
            const isExpanded = Boolean(expandedGroups[groupName]);
            const groupKeys = groupPerms.map((p) => p.key);
            const selectedCount = groupKeys.filter((k) =>
              role.isSpecial ? true : selectedKeys.has(k)
            ).length;
            const isAllGroupSelected =
              groupKeys.length > 0 && selectedCount === groupKeys.length;
            const isSomeGroupSelected = selectedCount > 0 && !isAllGroupSelected;

            return (
              <div
                key={groupName}
                className="rounded-lg border border-border-base bg-surface overflow-hidden transition-all shadow-2xs"
              >
                <div
                  onClick={() => toggleGroupAccordion(groupName)}
                  className="flex items-center justify-between px-3 py-2.5 bg-surface-subtle/50 hover:bg-surface-subtle cursor-pointer border-b border-border-base/40 select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                    )}

                    <h4 className="font-semibold text-text-primary text-xs capitalize font-heading truncate">
                      {groupName} Management
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-xs border",
                        isAllGroupSelected
                          ? "bg-brand/10 text-brand border-brand/20"
                          : isSomeGroupSelected
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-surface-subtle text-text-tertiary border-border-base"
                      )}
                    >
                      {isAllGroupSelected
                        ? "All Selected"
                        : `${selectedCount}/${groupKeys.length} Selected`}
                    </span>

                    {!isLocked && canManagePermissions && (
                      <input
                        type="checkbox"
                        checked={isAllGroupSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeGroupSelected;
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleAllGroupKeys(groupKeys, e.target.checked)}
                        className="rounded-xs border-border-base text-brand focus:ring-brand h-3.5 w-3.5 cursor-pointer"
                      />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 space-y-2 bg-surface">
                    <div className="grid grid-cols-1 gap-1.5">
                      {groupPerms.map((p) => {
                        const isChecked = role.isSpecial || selectedKeys.has(p.key);

                        return (
                          <label
                            key={p.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md border transition-all text-xs select-none",
                              isChecked
                                ? "bg-surface-subtle/80 border-border-strong text-text-primary"
                                : "bg-surface border-border-base text-text-secondary hover:border-border-strong"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <code className="font-mono text-[11px] font-semibold text-brand">
                                {p.key}
                              </code>
                              {p.description && (
                                <p className="text-[10px] text-text-tertiary line-clamp-1 mt-0.5">
                                  {p.description}
                                </p>
                              )}
                            </div>

                            <input
                              type="checkbox"
                              disabled={isLocked || !canManagePermissions}
                              checked={isChecked}
                              onChange={(e) => toggleKey(p.key, e.target.checked)}
                              className="rounded-xs border-border-base text-brand focus:ring-brand h-3.5 w-3.5 cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-border-base bg-surface flex items-center justify-between shadow-2xs mt-auto">
        <span className="text-[10px] text-text-tertiary">
          {role.isSpecial
            ? "Special role grants all permissions."
            : role.isSystem
            ? "System role is immutable."
            : `${selectedKeys.size} permission keys enabled`}
        </span>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-7">
            Cancel
          </Button>
          {!isLocked && canManagePermissions && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs h-7 shadow-2xs"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Comprehensive Modal Dialog for Create Role & Configure Permissions (Matching User HTML Mockup) */
function CreateRoleAndPermissionsModal({
  state,
  groups,
  onClose,
  onSaved,
}: {
  state: "create" | { edit: Role };
  groups: PermissionGroups;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state !== "create";
  const targetRole = isEdit ? (state as { edit: Role }).edit : null;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: targetRole?.name ?? "",
    displayName: targetRole?.displayName ?? "",
    description: targetRole?.description ?? "",
    priority: String(targetRole?.priority ?? 0),
  }));

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(targetRole?.permissionKeys ?? [])
  );

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    Object.values(groups).forEach((list) => {
      list.forEach((p) => keys.push(p.key));
    });
    return keys;
  }, [groups]);

  const isAllSelected = useMemo(() => {
    return allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
  }, [allKeys, selectedKeys]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedKeys(new Set(allKeys));
    } else {
      setSelectedKeys(new Set());
    }
  }

  function toggleKey(key: string, checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleModuleAction(groupName: string, actionType: "read" | "create" | "update" | "delete" | "all", checked: boolean) {
    const groupPerms = groups[groupName] || [];
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => {
        const [res, act] = p.key.split(":");
        const matchesAction =
          actionType === "all" ||
          (actionType === "read" && (act === "read" || act === "list" || act === "get")) ||
          (actionType === "create" && (act === "create" || act === "add")) ||
          (actionType === "update" && (act === "update" || act === "edit" || act === "patch")) ||
          (actionType === "delete" && (act === "delete" || act === "remove"));

        if (matchesAction) {
          if (checked) next.add(p.key);
          else next.delete(p.key);
        }
      });
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let roleId = targetRole?.id;

      if (isEdit && roleId) {
        await api.updateRole(roleId, {
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
      } else {
        const res = await api.createRole({
          name: form.name,
          displayName: form.displayName,
          description: form.description || null,
          priority: Number(form.priority) || 0,
        });
        roleId = res.data.id;
      }

      if (roleId) {
        await api.setRolePermissions(roleId, [...selectedKeys]);
      }

      toast.success(isEdit ? "Role & permissions updated" : "Role created & permissions assigned");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  const affectedUserCount = targetRole?._count?.users ?? 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-xl sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col bg-surface border border-border-base">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-border-base bg-surface-subtle/40 flex items-center justify-between flex-row">
          <div>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              {isEdit ? "Edit Role & Configure Permissions" : "Create Role & Configure Permissions"}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-tertiary mt-0.5">
              Define access levels and granular permissions for this role.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Role Details & User Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-7 space-y-3">
              {!isEdit && (
                <div className="space-y-1">
                  <Label htmlFor="modal-role-name" className="text-xs font-semibold text-text-primary">
                    Role Key / Code
                  </Label>
                  <Input
                    id="modal-role-name"
                    required
                    placeholder="e.g. senior_hr_manager, qa_lead"
                    className="text-xs h-8"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="modal-role-displayName" className="text-xs font-semibold text-text-primary">
                  Role Display Name
                </Label>
                <Input
                  id="modal-role-displayName"
                  required
                  placeholder="e.g., Senior HR Manager"
                  className="text-xs h-8"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-role-description" className="text-xs font-semibold text-text-primary">
                  Description
                </Label>
                <textarea
                  id="modal-role-description"
                  rows={2}
                  placeholder="Describe the responsibilities and access scope..."
                  className="w-full rounded-md border border-border-base bg-surface p-2 text-xs font-normal text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none min-h-[60px] resize-y leading-relaxed"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {/* Right Card: Assigned Users Preview */}
            <div className="md:col-span-5 bg-surface-subtle/50 p-3.5 rounded-xl border border-border-base space-y-2">
              <h4 className="font-semibold text-xs font-heading text-text-primary">
                Assigned Users Preview
              </h4>
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border-2 border-surface bg-brand/10 font-bold text-[10px] text-brand flex items-center justify-center border-brand/20">
                    JD
                  </div>
                  <div className="w-7 h-7 rounded-full border-2 border-surface bg-info/10 font-bold text-[10px] text-info flex items-center justify-center border-info/20">
                    AS
                  </div>
                  <div className="w-7 h-7 rounded-full border-2 border-surface bg-warning/10 font-bold text-[10px] text-warning flex items-center justify-center border-warning/20">
                    +{affectedUserCount}
                  </div>
                </div>
                <span className="text-xs text-text-secondary font-medium">
                  {affectedUserCount} {affectedUserCount === 1 ? "user" : "users"} will be affected by these changes.
                </span>
              </div>
              <p className="text-[10px] text-text-tertiary italic">
                Note: Permissions apply immediately to all users assigned to this role upon saving.
              </p>
            </div>
          </div>

          <hr className="border-border-base" />

          {/* Granular Permissions Module Matrix Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-text-primary font-heading">
                  Module Permissions
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Configure granular access rights for each system module.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4"
                />
                <span className="text-xs font-medium text-text-primary hover:text-brand transition-colors">
                  Select All Permissions
                </span>
              </label>
            </div>

            {/* Matrix Table */}
            <div className="border border-border-base rounded-xl overflow-hidden shadow-2xs">
              <Table>
                <TableHeader className="bg-surface-subtle/80">
                  <TableRow>
                    <TableHead className="font-semibold text-text-primary text-xs">Module Category</TableHead>
                    <TableHead className="font-semibold text-text-primary text-xs text-center w-20">View</TableHead>
                    <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Create</TableHead>
                    <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Edit</TableHead>
                    <TableHead className="font-semibold text-text-primary text-xs text-center w-20">Delete</TableHead>
                    <TableHead className="font-semibold text-text-primary text-xs text-center w-20">All</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groups).map(([groupName, groupPerms]) => {
                    const ModuleIcon = getModuleIcon(groupName);
                    const groupKeys = groupPerms.map((p) => p.key);

                    // Check actions
                    const viewKeys = groupKeys.filter((k) => k.endsWith(":read") || k.endsWith(":list") || k.endsWith(":get"));
                    const createKeys = groupKeys.filter((k) => k.endsWith(":create") || k.endsWith(":add"));
                    const updateKeys = groupKeys.filter((k) => k.endsWith(":update") || k.endsWith(":edit") || k.endsWith(":patch"));
                    const deleteKeys = groupKeys.filter((k) => k.endsWith(":delete") || k.endsWith(":remove"));

                    const isViewChecked = viewKeys.length > 0 && viewKeys.every((k) => selectedKeys.has(k));
                    const isCreateChecked = createKeys.length > 0 && createKeys.every((k) => selectedKeys.has(k));
                    const isUpdateChecked = updateKeys.length > 0 && updateKeys.every((k) => selectedKeys.has(k));
                    const isDeleteChecked = deleteKeys.length > 0 && deleteKeys.every((k) => selectedKeys.has(k));
                    const isGroupAllChecked = groupKeys.length > 0 && groupKeys.every((k) => selectedKeys.has(k));

                    return (
                      <TableRow key={groupName} className="hover:bg-surface-subtle/40">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-surface-subtle text-brand border border-border-base">
                              <ModuleIcon className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-xs text-text-primary capitalize font-heading">
                              {groupName} Management
                            </span>
                          </div>
                        </TableCell>

                        {/* View Checkbox */}
                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={viewKeys.length === 0}
                            checked={isViewChecked}
                            onChange={(e) => toggleModuleAction(groupName, "read", e.target.checked)}
                            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                          />
                        </TableCell>

                        {/* Create Checkbox */}
                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={createKeys.length === 0}
                            checked={isCreateChecked}
                            onChange={(e) => toggleModuleAction(groupName, "create", e.target.checked)}
                            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                          />
                        </TableCell>

                        {/* Edit Checkbox */}
                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={updateKeys.length === 0}
                            checked={isUpdateChecked}
                            onChange={(e) => toggleModuleAction(groupName, "update", e.target.checked)}
                            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                          />
                        </TableCell>

                        {/* Delete Checkbox */}
                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={deleteKeys.length === 0}
                            checked={isDeleteChecked}
                            onChange={(e) => toggleModuleAction(groupName, "delete", e.target.checked)}
                            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer disabled:opacity-30"
                          />
                        </TableCell>

                        {/* All Checkbox */}
                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isGroupAllChecked}
                            onChange={(e) => toggleModuleAction(groupName, "all", e.target.checked)}
                            className="rounded-xs border-border-base text-brand focus:ring-brand h-4 w-4 cursor-pointer"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border-base">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving} className="text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs h-8 gap-1.5 shadow-2xs">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : isEdit ? "Save Role & Permissions" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}