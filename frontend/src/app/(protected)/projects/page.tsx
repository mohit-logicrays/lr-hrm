"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Project, ProjectDetail, ProjectStatus, Team, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { StatusPill } from "@/lib/labels";
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
import { FolderKanban, Pencil, Plus, Search, Trash2, Users } from "lucide-react";

const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];

function memberName(u: { firstName: string; lastName: string; email: string }) {
  return `${u.firstName} ${u.lastName}`.trim() || u.email;
}

export default function ProjectsPage() {
  const perms = usePermission("project");
  const [result, setResult] = useState<{ data: Project[]; total: number; totalPages: number } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: Project } | null>(null);
  const [detail, setDetail] = useState<{ project: Project; detail: ProjectDetail } | null>(null);

  const load = useCallback(async () => {
    try {
      const [projects, t] = await Promise.all([
        api.listProjects(page, 10, search, (status as ProjectStatus) || undefined),
        api.listTeams(1, 100),
      ]);
      setTeams(t.data);
      setResult({ data: projects.data, total: projects.pagination.total, totalPages: projects.pagination.totalPages });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(project: Project) {
    try {
      const res = await api.getProject(project.id);
      setDetail({ project, detail: res.data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load project");
    }
  }

  async function reloadDetail() {
    if (!detail) return;
    try {
      const res = await api.getProject(detail.project.id);
      setDetail((d) => (d ? { project: d.project, detail: res.data } : d));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load project");
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    try {
      await api.deleteProject(project.id);
      toast.success("Project deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        subtitle={result ? `${result.total} projects` : "Projects and deliverables"}
        actions={
          perms.create ? (
            <Button onClick={() => setDialog("create")}>
              <Plus /> New project
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          aria-label="Filter by status"
          className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Logs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              result?.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                    {p.code ? <p className="text-xs text-text-tertiary">{p.code}</p> : null}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {p.team?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {p._count?.members ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {p._count?.timeLogs ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="View members" onClick={() => openDetail(p)}>
                        <Users />
                      </Button>
                      {perms.update && (
                        <Button variant="ghost" size="icon-sm" aria-label="Edit project" onClick={() => setDialog({ edit: p })}>
                          <Pencil />
                        </Button>
                      )}
                      {perms.delete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete project"
                          className="text-muted-foreground hover:text-error"
                          onClick={() => handleDelete(p)}
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
        <ProjectFormDialog
          project={dialog === "create" ? null : (dialog as { edit: Project }).edit}
          teams={teams}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}

      {detail && (
        <ProjectDetailDialog
          project={detail.project}
          detail={detail.detail}
          canManageMembers={Boolean(perms.manage_members)}
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

function ProjectFormDialog({
  project,
  teams,
  onClose,
  onSaved,
}: {
  project: Project | null;
  teams: Team[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: project?.name ?? "",
    code: project?.code ?? "",
    description: project?.description ?? "",
    status: (project?.status ?? "PLANNING") as ProjectStatus,
    teamId: project?.teamId ?? "",
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (project) {
        await api.updateProject(project.id, {
          name: form.name,
          code: form.code || null,
          description: form.description || null,
          status: form.status,
          teamId: form.teamId || null,
        });
        toast.success("Project updated");
      } else {
        await api.createProject({
          name: form.name,
          code: form.code || null,
          description: form.description || null,
          status: form.status,
          teamId: form.teamId || null,
        });
        toast.success("Project created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            Projects are grouped by team and tracked with time logs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamId">Team</Label>
            <select
              id="teamId"
              className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
            >
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetailDialog({
  project,
  detail,
  canManageMembers,
  onClose,
  onChanged,
}: {
  project: Project;
  detail: ProjectDetail;
  canManageMembers: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [newMember, setNewMember] = useState({ userId: "", projectRole: "" });
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
    if (!newMember.userId) return;
    setBusy(true);
    try {
      await api.addProjectMember({
        projectId: project.id,
        userId: newMember.userId,
        projectRole: newMember.projectRole || null,
      });
      toast.success("Member added");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!window.confirm("Remove this member from the project?")) return;
    setBusy(true);
    try {
      await api.removeProjectMember(project.id, userId);
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
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-brand" />
            {project.name}
          </DialogTitle>
          <DialogDescription>
            {project.team?.name ?? "No team"} · <StatusPill status={project.status} />
          </DialogDescription>
        </DialogHeader>

        {canManageMembers && (
          <div className="space-y-2 rounded-lg border border-border-base p-3">
            <Label htmlFor="member">Add member</Label>
            <div className="flex gap-2">
              <select
                id="member"
                className="h-10 flex-1 rounded-md border border-border-base bg-surface px-3 text-sm"
                value={newMember.userId}
                onChange={(e) => setNewMember((m) => ({ ...m, userId: e.target.value }))}
              >
                <option value="">Select a user…</option>
                {addable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                  </option>
                ))}
              </select>
              <Input
                className="w-40"
                placeholder="Role (optional)"
                value={newMember.projectRole}
                onChange={(e) => setNewMember((m) => ({ ...m, projectRole: e.target.value }))}
              />
              <Button onClick={addMember} disabled={!newMember.userId || busy}>
                <Plus /> Add
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {detail.members.length === 0 && (
            <p className="text-sm text-text-tertiary">No members yet. Add the first member above.</p>
          )}
          {detail.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border-base px-3 py-2"
            >
              <div>
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  {memberName(m.user)}
                  {m.projectRole && (
                    <Badge className="bg-info-light text-info">{m.projectRole}</Badge>
                  )}
                </span>
                <span className="text-xs text-text-tertiary">{m.user.email}</span>
              </div>
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
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}