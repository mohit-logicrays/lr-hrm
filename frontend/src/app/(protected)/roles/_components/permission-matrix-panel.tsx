"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { api, type PermissionGroups, type Role } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE } from "./motion";

export function PermissionMatrixPanel({
  role,
  groups,
  canManagePermissions,
  isExpanded,
  onToggle,
  onClose,
  onSaved,
}: {
  role: Role;
  groups: PermissionGroups;
  canManagePermissions: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isLocked = Boolean(role.isSpecial || role.isSystem);

  return (
    <div className="flex flex-col h-full bg-surface">
      {isExpanded ? (
        <ExpandedMatrix
          role={role}
          groups={groups}
          isLocked={isLocked}
          canManagePermissions={canManagePermissions}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : (
        <MinimizedTab role={role} onToggle={onToggle} />
      )}
    </div>
  );
}

/* Minimized vertical tab - click to expand the matrix panel */
function MinimizedTab({ role, onToggle }: { role: Role; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2, ease: EASE } }}
      className="group flex flex-col items-center gap-3 py-6 h-full w-full transition-colors hover:bg-surface-subtle/40 cursor-pointer"
      aria-label="Expand permission matrix"
    >
      <motion.span
        whileHover={{ scale: 1.08 }}
        className="p-2 rounded-lg bg-brand/10 text-brand border border-brand/20"
      >
        <KeyRound className="h-4 w-4" />
      </motion.span>
      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold text-text-primary tracking-widest uppercase">
        Permission Matrix
      </span>
      <span className="mt-auto flex flex-col items-center gap-2 text-text-tertiary">
        <span className="w-px h-8 bg-border-base" />
        <span className="text-[9px] font-medium uppercase tracking-wider hidden lg:block">
          {role.displayName}
        </span>
      </span>
    </motion.button>
  );
}

/* Full permission matrix panel content */
function ExpandedMatrix({
  role,
  groups,
  isLocked,
  canManagePermissions,
  onClose,
  onSaved,
}: {
  role: Role;
  groups: PermissionGroups;
  isLocked: boolean;
  canManagePermissions: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
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

  const toggleGroupAccordion = useCallback((group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

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
    <>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex items-center justify-between p-3 rounded-lg border border-brand/20 bg-surface-container shadow-2xs"
        >
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
        </motion.div>

        <div className="space-y-2">
          {Object.entries(groups).map(([groupName, groupPerms], groupIdx) => {
            const isExpandedState = Boolean(expandedGroups[groupName]);
            const groupKeys = groupPerms.map((p) => p.key);
            const selectedCount = groupKeys.filter((k) =>
              role.isSpecial ? true : selectedKeys.has(k)
            ).length;
            const isAllGroupSelected =
              groupKeys.length > 0 && selectedCount === groupKeys.length;
            const isSomeGroupSelected = selectedCount > 0 && !isAllGroupSelected;

            return (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: EASE, delay: groupIdx * 0.04 }}
                className="rounded-lg border border-border-base bg-surface overflow-hidden transition-all shadow-2xs"
              >
                <div
                  onClick={() => toggleGroupAccordion(groupName)}
                  className="flex items-center justify-between px-3 py-2.5 bg-surface-subtle/50 hover:bg-surface-subtle cursor-pointer border-b border-border-base/40 select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <motion.span
                      animate={{ rotate: isExpandedState ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isExpandedState ? (
                        <ChevronDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                      )}
                    </motion.span>

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

                <AnimatePresence initial={false}>
                  {isExpandedState && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
    </>
  );
}