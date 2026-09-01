"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Department, Team, TeamDetail, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";

function memberName(u: { firstName: string; lastName: string; email: string }) {
  return `${u.firstName} ${u.lastName}`.trim() || u.email;
}

export default function TeamsPage() {
  const perms = usePermission("team");
  const [result, setResult] = useState<{
    data: Team[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: Team } | null>(null);
  const [detail, setDetail] = useState<{ team: Team; detail: TeamDetail } | null>(null);

  const load = useCallback(async () => {
    try {
      const [teams, deps] = await Promise.all([
        api.listTeams(page, 10, search),
        api.listDepartments(1, 100),
      ]);
      setDepartments(deps.data);
      setResult({
        data: teams.data,
        total: teams.pagination.total,
        totalPages: teams.pagination.totalPages,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(team: Team) {
    try {
      const res = await api.getTeam(team.id);
      setDetail({ team, detail: res.data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    }
  }

  async function reloadDetail() {
    if (!detail) return;
    try {
      const res = await api.getTeam(detail.team.id);
      setDetail((d) => (d ? { team: d.team, detail: res.data } : d));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    }
  }

  async function handleDelete(team: Team) {
    if (!window.confirm(`Delete team "${team.name}"?`)) return;
    try {
      await api.deleteTeam(team.id);
      toast.success("Team deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Management"
        subtitle={result ? `${result.total} teams` : "Teams across departments"}
        actions={
          perms.create ? (
            <Button onClick={() => setDialog("create")}>
              <Plus /> New team
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          className="pl-9"
          placeholder="Search teams…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              result?.data.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <span className="font-medium">{team.name}</span>
                    {team.description ? (
                      <p className="text-xs text-text-tertiary line-clamp-1">
                        {team.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {team.department?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {team._count?.members ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {team._count?.projects ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="View members"
                        onClick={() => openDetail(team)}
                      >
                        <UsersRound />
                      </Button>
                      {perms.update && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit team"
                          onClick={() => setDialog({ edit: team })}
                        >
                          <Pencil />
                        </Button>
                      )}
                      {perms.delete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete team"
                          className="text-muted-foreground hover:text-error"
                          onClick={() => handleDelete(team)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        pagination={
          result
            ? {
                total: result.total,
                page,
                pageSize: 10,
                totalPages: result.totalPages,
                hasPrevious: page > 1,
                hasNext: page < result.totalPages,
                previous: page > 1 ? page - 1 : null,
                next: page < result.totalPages ? page + 1 : null,
              }
            : null
        }
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {dialog && (
        <TeamFormDialog
          team={dialog === "create" ? null : (dialog as { edit: Team }).edit}
          departments={departments}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}

      {detail && (
        <TeamDetailDialog
          team={detail.team}
          detail={detail.detail}
          canManageMembers={Boolean(perms.manage_members)}
          canManageLeads={Boolean(perms.manage_leads)}
          onClose={() => setDetail(null)}
          onChanged={() => {
            reloadDetail();
            load();
          }}
        />
      )}
    </div>
  );
}

function TeamFormDialog({
  team,
  departments,
  onClose,
  onSaved,
}: {
  team: Team | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: team?.name ?? "",
    description: team?.description ?? "",
    departmentId: team?.departmentId ?? departments[0]?.id ?? "",
  }));

  useEffect(() => {
    if (!form.departmentId && departments[0]) {
      setForm((f) => ({ ...f, departmentId: departments[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (team) {
        await api.updateTeam(team.id, {
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team updated");
      } else {
        await api.createTeam({
          name: form.name,
          description: form.description || null,
          departmentId: form.departmentId,
        });
        toast.success("Team created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save team");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{team ? "Edit team" : "Create team"}</DialogTitle>
          <DialogDescription>
            {team
              ? "Update team name, description and department."
              : "Create a team within a department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department</Label>
            <select
              id="departmentId"
              required
              className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
            >
              {departments.length === 0 && <option value="">Loading…</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !form.departmentId}>
              {saving ? "Saving…" : team ? "Save changes" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamDetailDialog({
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
      toast.success("Member added");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function setLead(userId: string, isTeamLead: boolean) {
    setBusy(true);
    try {
      await api.updateTeamMember(team.id, userId, { isTeamLead });
      toast.success("Team lead updated");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!window.confirm("Remove this member from the team?")) return;
    setBusy(true);
    try {
      await api.removeTeamMember(team.id, userId);
      toast.success("Member removed");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>
            {team.department?.name ?? "No department"} · {detail.members.length}{" "}
            members
          </DialogDescription>
        </DialogHeader>

        {canManageMembers && (
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="member">Add member</Label>
              <select
                id="member"
                className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select a user…</option>
                {addable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={addMember} disabled={!selectedUserId || busy}>
              <Plus /> Add
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {detail.members.length === 0 && (
            <p className="text-sm text-text-tertiary">
              No members yet. Add the first member above.
            </p>
          )}
          {detail.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border-base px-3 py-2"
            >
              <div>
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  {memberName(m.user)}
                  {m.isTeamLead && (
                    <Badge className="bg-warning-light text-warning">
                      <Crown className="h-3 w-3" /> Lead
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-text-tertiary">
                  {m.user.email}
                  {m.user.designation ? ` · ${m.user.designation}` : ""}
                </span>
              </div>
              <div className="flex gap-1">
                {canManageLeads && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => setLead(m.user.id, !m.isTeamLead)}
                  >
                    {m.isTeamLead ? "Remove lead" : "Make lead"}
                  </Button>
                )}
                {canManageMembers && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-error"
                    disabled={busy}
                    onClick={() => removeMember(m.user.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}