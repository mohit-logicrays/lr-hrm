"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { api, Project, TimeLog, TimeLogStatus, User } from "@/lib/api";
import { usePermission } from "@/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { StatusPill } from "@/lib/labels";
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
import { Check, Plus, Trash2, X } from "lucide-react";

function userName(u: { firstName?: string; lastName?: string; email: string }) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimePage() {
  const perms = usePermission("time");
  const canReadAll = perms.read_all || perms.manage;
  const [result, setResult] = useState<{ data: TimeLog[]; pagination: { total: number; pageSize: number; totalPages: number; hasPrevious: boolean; hasNext: boolean; previous: number | null; next: number | null } } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.listTimeLogs(page, 10, {
        userId: canReadAll ? userId || undefined : undefined,
        projectId: projectId || undefined,
        status: (status as TimeLogStatus) || undefined,
      });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load time logs");
    } finally {
      setLoading(false);
    }
  }, [page, userId, projectId, status, canReadAll]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canReadAll) return;
    api
      .listUsers(1, 200)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, [canReadAll]);

  useEffect(() => {
    api
      .listProjects(1, 200)
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, []);

  async function decide(tl: TimeLog, decision: "APPROVED" | "REJECTED") {
    try {
      await api.approveTimeLog(tl.id, decision);
      toast.success(decision === "APPROVED" ? "Log approved" : "Log rejected");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update log");
    }
  }

  async function remove(tl: TimeLog) {
    if (!window.confirm("Delete this time log?")) return;
    try {
      await api.deleteTimeLog(tl.id);
      toast.success("Time log deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete log");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Time & Attendance"
        subtitle={result ? `${result.pagination.total} logs` : "Track working hours"}
        actions={
          perms.log ? (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Log time
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {(canReadAll || perms.log) && (
          <select
            aria-label="Filter by user"
            className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
            value={userId}
            onChange={(e) => {
              setPage(1);
              setUserId(e.target.value);
            }}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {userName(u)}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter by project"
          className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
          value={projectId}
          onChange={(e) => {
            setPage(1);
            setProjectId(e.target.value);
          }}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
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
              result?.data.map((tl) => (
                <TableRow key={tl.id}>
                  <TableCell className="font-medium">
                    {new Date(tl.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {tl.user ? userName(tl.user) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {tl.project?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {fmtDuration(tl.durationMin)}
                    <span className="ml-1 text-xs text-text-tertiary">
                      {tl.startTime}–{tl.endTime}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={tl.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {tl.status === "PENDING" && perms.approve && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Approve" className="text-success" onClick={() => decide(tl, "APPROVED")}>
                            <Check />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Reject" className="text-error" onClick={() => decide(tl, "REJECTED")}>
                            <X />
                          </Button>
                        </>
                      )}
                      {(perms.manage || tl.status === "PENDING") && (
                        <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-muted-foreground hover:text-error" onClick={() => remove(tl)}>
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
                total: result.pagination.total,
                page,
                pageSize: result.pagination.pageSize,
                totalPages: result.pagination.totalPages,
                hasPrevious: result.pagination.hasPrevious,
                hasNext: result.pagination.hasNext,
                previous: result.pagination.previous,
                next: result.pagination.next,
              }
            : null
        }
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {creating && (
        <CreateTimeLogDialog
          projects={projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING")}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateTimeLogDialog({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "17:30",
    projectId: "",
    userId: "",
    description: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createTimeLog({
        projectId: form.projectId || null,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description || null,
      });
      toast.success("Time logged");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log time</DialogTitle>
          <DialogDescription>
            Record working hours against a project. The manager reviews pending
            logs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <select
              id="projectId"
              className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Log time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}