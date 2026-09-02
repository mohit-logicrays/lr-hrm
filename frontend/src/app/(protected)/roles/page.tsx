"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { api, type PermissionGroups, type Role } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { RolesPageHeader } from "./_components/roles-page-header";
import { RolesList } from "./_components/roles-list";
import { PermissionMatrixPanel } from "./_components/permission-matrix-panel";
import { CreateRoleAndPermissionsModal } from "./_components/create-role-modal";
import { fadeInUp, staggerContainer } from "./_components/motion";
import type { ViewMode } from "./_components/role-helpers";

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
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
      <RolesPageHeader
        roleCount={roles.length}
        canManage={canManage}
        onExport={handleExport}
        onAddRole={() => setFormModalState("create")}
      />

      {/* Main Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Roles List & View Switcher (dynamically sized by matrix panel state) */}
        <motion.div
          variants={fadeInUp}
          className={cn(
            "min-w-0",
            matrixExpanded ? "lg:col-span-7 xl:col-span-7" : "lg:col-span-11 xl:col-span-11"
          )}
        >
          <RolesList
            roles={filteredRoles}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedRole={selectedRole}
            onSelectRole={selectRole}
            canManage={canManage}
            onEdit={(role) => setFormModalState({ edit: role })}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* Right Column: Permission Matrix Preview Drawer (dynamically sized) */}
        <motion.div
          variants={fadeInUp}
          className={cn(
            "flex flex-col bg-surface rounded-xl border border-border-base shadow-sm overflow-hidden transition-all min-w-0",
            matrixExpanded ? "lg:col-span-5 xl:col-span-5 min-h-[500px]" : "lg:col-span-1 xl:col-span-1"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {selectedRole ? (
              <motion.div
                key="matrix-panel"
                className={cn(
                  "flex flex-col h-full",
                  matrixExpanded ? "flex" : "flex"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <PermissionMatrixPanel
                  role={selectedRole}
                  groups={groups}
                  canManagePermissions={Boolean(canManagePermissions)}
                  isExpanded={matrixExpanded}
                  onToggle={() => setMatrixExpanded((v) => !v)}
                  onClose={() => setMatrixExpanded(false)}
                  onSaved={() => {
                    load();
                  }}
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-max min-h-[500px]">
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
        </motion.div>
      </div>

      {/* Comprehensive Modal Dialog for Create Role & Configure Permissions */}
      <AnimatePresence>
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
      </AnimatePresence>
    </motion.div>
  );
}