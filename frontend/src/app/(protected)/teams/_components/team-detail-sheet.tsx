"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type Team, type TeamDetail, type User } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  UserPlus,
  Plus,
  Trash2,
  FileText,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { getInitials, memberName } from "./team-helpers";
import { sheetVariants } from "./motion";

export function TeamDetailSheet({
  team,
  detail,
  canManageMembers,
  canManageLeads,
  onClose,
  onChanged,
}: {
  team: Team;
  detail: TeamDetail;
  canManageMembers: boolean;
  canManageLeads: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [asTeamLead, setAsTeamLead] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listUsers(1, 100)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, []);

  const memberIds = new Set(detail.members.map((m) => m.user.id));
  const addable = users.filter((u) => !memberIds.has(u.id));

  async function addMember() {
    if (!selectedUserId) return;
    setBusy(true);
    try {
      await api.addTeamMember({ teamId: team.id, userId: selectedUserId });

      if (asTeamLead && canManageLeads) {
        await api.updateTeamMember(team.id, selectedUserId, { isTeamLead: true });
        toast.success("Member added and designated as Team Lead");
      } else {
        toast.success("Member added to team");
      }

      setSelectedUserId("");
      setAsTeamLead(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function setLead(userId: string, isTeamLead: boolean) {
    if (!canManageLeads) {
      toast.error("You do not have permission to manage team leads");
      return;
    }
    setBusy(true);
    try {
      await api.updateTeamMember(team.id, userId, { isTeamLead });
      toast.success(isTeamLead ? "Designated as Team Lead" : "Removed Team Lead status");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead status");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!canManageMembers) {
      toast.error("You do not have permission to remove members");
      return;
    }
    if (!window.confirm("Remove this member from the team?")) return;
    setBusy(true);
    try {
      await api.removeTeamMember(team.id, userId);
      toast.success("Member removed from team");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-surface overflow-hidden">
        <SheetHeader className="p-3 border-b border-border-base bg-surface-subtle/30">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div>
              <SheetTitle className="font-heading text-sm font-bold text-text-primary">
                {team.name}
              </SheetTitle>
              <SheetDescription className="text-[10px] text-text-tertiary mt-0.5">
                {team.department?.name ?? "No Department"} &bull; {detail.members.length}{" "}
                {detail.members.length === 1 ? "member" : "members"}
              </SheetDescription>
            </div>
            {team.department && (
              <Badge variant="outline" className="text-[9px] font-normal rounded-xs px-1.5 py-0">
                {team.department.name}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <motion.div
          variants={sheetVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex-1 overflow-y-auto p-3 space-y-3"
        >
          {team.description && (
            <div className="rounded-md border border-border-base bg-surface p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  <FileText className="h-3 w-3 text-brand" /> Full Rich Description
                </div>
                <span className="text-[9px] text-text-tertiary">Scroll view</span>
              </div>
              <div className="max-h-40 overflow-y-auto pr-1">
                <RichTextViewer content={team.description} />
              </div>
            </div>
          )}

          {canManageMembers ? (
            <div className="space-y-1.5 rounded-md border border-border-base bg-surface-subtle/40 p-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-member-select-sheet" className="text-xs font-semibold text-text-primary flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5 text-brand" /> Add Team Member
                </Label>
                <span className="text-[10px] text-text-tertiary font-medium">RBAC Enabled</span>
              </div>

              <div className="space-y-1.5">
                <select
                  id="add-member-select-sheet"
                  className="h-7.5 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-colors focus:border-brand focus:outline-none"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select organization user...</option>
                  {addable.map((u) => (
                    <option key={u.id} value={u.id}>
                      {memberName(u)}
                      {u.designation ? ` (${u.designation})` : ""}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between pt-0.5">
                  {canManageLeads ? (
                    <label className="flex items-center gap-1 cursor-pointer text-xs text-text-secondary select-none">
                      <input
                        type="checkbox"
                        checked={asTeamLead}
                        onChange={(e) => setAsTeamLead(e.target.checked)}
                        className="rounded-xs border-border-base text-brand focus:ring-brand h-3.5 w-3.5"
                      />
                      <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Crown className="h-3 w-3" /> Add as Team Lead (TL)
                      </span>
                    </label>
                  ) : (
                    <span className="text-[10px] text-text-tertiary italic flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Member Role
                    </span>
                  )}

                  <Button
                    size="sm"
                    onClick={addMember}
                    disabled={!selectedUserId || busy}
                    className="gap-1 h-7 text-xs px-3 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Member
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border-base bg-surface-subtle/30 p-2 text-xs text-text-tertiary text-center">
              You have read-only access to team roster.
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                Team Roster ({detail.members.length})
              </h4>
            </div>

            {detail.members.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-base py-5 text-center text-xs text-text-tertiary">
                No members assigned to this team yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {detail.members.map((m) => {
                  const name = memberName(m.user);
                  const initials = getInitials(name);

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-between rounded-md border border-border-base bg-surface p-2 transition-colors hover:border-border-strong"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-xs text-brand border border-brand/20">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {name}
                            </span>
                            {m.isTeamLead && (
                              <span className="inline-flex items-center gap-0.5 rounded-xs bg-amber-500/10 px-1 py-0.1 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                <Crown className="h-2.5 w-2.5" /> TL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-tertiary truncate">
                            {m.user.email}
                            {m.user.designation ? ` \u2022 ${m.user.designation}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {canManageLeads && (
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={busy}
                            onClick={() => setLead(m.user.id, !m.isTeamLead)}
                            className={`text-[10px] h-6 px-1.5 ${
                              m.isTeamLead
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-text-tertiary hover:text-text-primary"
                            }`}
                          >
                            {m.isTeamLead ? "Demote TL" : "Make TL"}
                          </Button>
                        )}
                        {canManageMembers && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Remove member"
                            className="text-text-tertiary hover:text-error hover:bg-error/10 h-6 w-6"
                            disabled={busy}
                            onClick={() => removeMember(m.user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <SheetFooter className="p-2.5 border-t border-border-base bg-surface-subtle/20">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full text-xs h-7">
            Close Panel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}