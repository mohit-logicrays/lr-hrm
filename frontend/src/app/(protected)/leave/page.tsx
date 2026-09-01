"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  api,
  LeaveBalanceResponse,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  User,
} from "@/lib/api";
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
import { CalendarPlus, Check, Pencil, Plus, Trash2, X } from "lucide-react";

type Tab = "requests" | "types" | "balances";

function userName(u: { firstName?: string; lastName?: string; email: string }) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

export default function LeavePage() {
  const perms = usePermission("leave");
  const [tab, setTab] = useState<Tab>("requests");

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "requests", label: "Requests", show: Boolean(perms.read_own || perms.read_all) },
    { id: "types", label: "Leave types", show: Boolean(perms.type_read || perms.type_manage) },
    { id: "balances", label: "Balances", show: Boolean(perms.balance_read || perms.balance_manage) },
  ];
  const visible = tabs.filter((t) => t.show);
  const active: Tab = visible.some((t) => t.id === tab) ? tab : (visible[0]?.id ?? "requests");

  return (
    <div className="space-y-4">
      <PageHeader title="Leave Management" subtitle="Requests, leave types, and balances" />
      {visible.length > 1 && (
        <div className="flex gap-1 rounded-lg border border-border-base bg-surface p-1 w-fit">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                active === t.id ? "bg-brand text-white" : "text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {active === "requests" && <RequestsTab />}
      {active === "types" && <TypesTab />}
      {active === "balances" && <BalancesTab />}
    </div>
  );
}

function RequestsTab() {
  const perms = usePermission("leave");
  const canReadAll = perms.read_all || perms.approve;
  const [result, setResult] = useState<{ data: LeaveRequest[]; total: number; totalPages: number } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.listLeaveRequests(page, 10, {
        userId: canReadAll ? userId || undefined : undefined,
        leaveTypeId: leaveTypeId || undefined,
        status: (status as LeaveRequestStatus) || undefined,
      });
      setResult({ data: res.data, total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, userId, leaveTypeId, status, canReadAll]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .listLeaveTypes(1, 100)
      .then((res) => setTypes(res.data))
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    if (!canReadAll) return;
    api
      .listUsers(1, 200)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, [canReadAll]);

  async function decide(r: LeaveRequest, decision: "APPROVED" | "REJECTED") {
    try {
      await api.approveLeaveRequest(r.id, decision);
      toast.success(decision === "APPROVED" ? "Request approved" : "Request rejected");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update request");
    }
  }

  async function cancel(r: LeaveRequest) {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await api.cancelLeaveRequest(r.id);
      toast.success("Request cancelled");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel request");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {(canReadAll || perms.request) && (
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
            aria-label="Filter by type"
            className="h-10 rounded-md border border-border-base bg-surface px-3 text-sm"
            value={leaveTypeId}
            onChange={(e) => {
              setPage(1);
              setLeaveTypeId(e.target.value);
            }}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {perms.request && (
          <Button onClick={() => setCreating(true)}>
            <CalendarPlus /> New request
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
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
              result?.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.user ? userName(r.user) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={r.leaveType?.isPaid ? "bg-info-light text-info" : "bg-neutral-100 text-neutral-700"}>
                      {r.leaveType?.name ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {new Date(r.startDate).toLocaleDateString()} →{" "}
                    {new Date(r.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{r.days}</TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {r.status === "PENDING" && perms.approve && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Approve" className="text-success" onClick={() => decide(r, "APPROVED")}>
                            <Check />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Reject" className="text-error" onClick={() => decide(r, "REJECTED")}>
                            <X />
                          </Button>
                        </>
                      )}
                      {r.status === "PENDING" && perms.request && (
                        <Button variant="ghost" size="icon-sm" aria-label="Cancel" className="text-muted-foreground hover:text-text-primary" onClick={() => cancel(r)}>
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
            ? { total: result.total, page, pageSize: 10, totalPages: result.totalPages, hasPrevious: page > 1, hasNext: page < result.totalPages, previous: page > 1 ? page - 1 : null, next: page < result.totalPages ? page + 1 : null }
            : null
        }
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {creating && (
        <CreateRequestDialog
          types={types}
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

function CreateRequestDialog({
  types,
  onClose,
  onCreated,
}: {
  types: LeaveType[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    leaveTypeId: types[0]?.id ?? "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLeaveRequest({
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || null,
      });
      toast.success("Leave requested");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request leave");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
          <DialogDescription>Select a leave type and the date range.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Leave type</Label>
            <select
              id="type"
              className="h-10 w-full rounded-md border border-border-base bg-surface px-3 text-sm"
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
            >
              {types.length === 0 && <option value="">No leave types</option>}
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End</Label>
              <Input
                id="endDate"
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !form.leaveTypeId}>
              {saving ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypesTab() {
  const perms = usePermission("leave");
  const canManage = perms.type_manage;
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"create" | { edit: LeaveType } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listLeaveTypes(1, 100);
      setTypes(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leave types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(t: LeaveType) {
    if (!window.confirm(`Delete leave type "${t.name}"?`)) return;
    try {
      await api.deleteLeaveType(t.id);
      toast.success("Leave type deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete leave type");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canManage && (
          <Button onClick={() => setDialog("create")}>
            <Plus /> New leave type
          </Button>
        )}
      </div>
      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Max days / year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-text-secondary">{t.code}</TableCell>
                  <TableCell className="text-text-secondary">
                    {t.maxDaysPerYear ?? "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge className={t.isPaid ? "bg-info-light text-info" : "bg-neutral-100 text-neutral-700"}>
                      {t.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setDialog({ edit: t })}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-muted-foreground hover:text-error" onClick={() => remove(t)}>
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {dialog && (
        <LeaveTypeDialog
          leaveType={dialog === "create" ? null : (dialog as { edit: LeaveType }).edit}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function LeaveTypeDialog({
  leaveType,
  onClose,
  onSaved,
}: {
  leaveType: LeaveType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: leaveType?.name ?? "",
    code: leaveType?.code ?? "",
    maxDaysPerYear: leaveType?.maxDaysPerYear?.toString() ?? "",
    isPaid: leaveType?.isPaid ?? true,
  }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (leaveType) {
        await api.updateLeaveType(leaveType.id, {
          name: form.name,
          maxDaysPerYear: form.maxDaysPerYear ? Number(form.maxDaysPerYear) : null,
          isPaid: form.isPaid,
        });
        toast.success("Leave type updated");
      } else {
        await api.createLeaveType({
          name: form.name,
          code: form.code,
          maxDaysPerYear: form.maxDaysPerYear ? Number(form.maxDaysPerYear) : null,
          isPaid: form.isPaid,
        });
        toast.success("Leave type created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{leaveType ? "Edit leave type" : "Create leave type"}</DialogTitle>
          <DialogDescription>Leave types map to yearly balances.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" required disabled={Boolean(leaveType)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDays">Max days / year</Label>
              <Input id="maxDays" type="number" min={0} value={form.maxDaysPerYear} onChange={(e) => setForm({ ...form, maxDaysPerYear: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
            />
            Paid leave
          </label>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : leaveType ? "Save changes" : "Create type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BalancesTab() {
  const perms = usePermission("leave");
  const canManage = perms.balance_manage;
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    Promise.all([api.listUsers(1, 200), api.listLeaveTypes(1, 100)])
      .then(([u, t]) => {
        setUsers(u.data);
        setTypes(t.data);
        if (!selectedUser && u.data[0]) setSelectedUser(u.data[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBalance = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const res = await api.getUserLeaveBalance(selectedUser, year);
      setBalance(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, [selectedUser, year]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  async function allocate(leaveTypeId: string) {
    const allocated = window.prompt(`Allocate days for ${year} (current ${types.find((t) => t.id === leaveTypeId)?.name ?? ""}):`);
    if (allocated === null) return;
    const n = Number(allocated);
    if (Number.isNaN(n) || n < 0) return;
    setAllocating(true);
    try {
      await api.allocateLeave({ userId: selectedUser, leaveTypeId, year, allocated: n });
      toast.success("Balance updated");
      loadBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update balance");
    } finally {
      setAllocating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="User"
          className="h-10 max-w-xs rounded-md border border-border-base bg-surface px-3 text-sm"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {userName(u)}
            </option>
          ))}
        </select>
        <input
          aria-label="Year"
          type="number"
          min={2000}
          max={2100}
          className="h-10 w-24 rounded-md border border-border-base bg-surface px-3 text-sm"
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || year)}
        />
      </div>

      <div className="rounded-lg border border-border-base bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave type</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canManage ? 5 : 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !balance ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-sm text-text-tertiary">
                  Select a user to view balances.
                </TableCell>
              </TableRow>
            ) : balance.balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-sm text-text-tertiary">
                  No balances allocated for {year}. {canManage && "Use the add action to allocate."}
                </TableCell>
              </TableRow>
            ) : (
              balance.balances.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.leaveType?.name ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{b.allocated} days</TableCell>
                  <TableCell className="text-text-secondary">{b.used} days</TableCell>
                  <TableCell className="font-medium">
                    {b.allocated - b.used} days
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" aria-label="Allocate" disabled={allocating} onClick={() => allocate(b.leaveTypeId)}>
                        <Pencil />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
            {canManage && balance && balance.balances.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-wrap gap-2">
                    {types.map((t) => (
                      <Button key={t.id} size="sm" variant="outline" disabled={allocating} onClick={() => allocate(t.id)}>
                        <Plus /> {t.name}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}