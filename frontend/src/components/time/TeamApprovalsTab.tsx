"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api, type TimeLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  CheckCheck,
  XCircle,
  Eye,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-success/10 text-success border-success/30";
    case "SUBMITTED":
    case "PENDING":
      return "bg-warning/10 text-warning border-warning/30";
    case "REJECTED":
      return "bg-error/10 text-error border-error/30";
    default:
      return "bg-surface-subtle text-text-tertiary border-border-base";
  }
}

export function TeamApprovalsTab() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");
  const [search, setSearch] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection Dialog / Drawer State
  const [inspectLog, setInspectLog] = useState<TimeLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listTimeLogs(1, 100, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setLogs(res.data || []);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to load team timesheets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove(id: string) {
    try {
      setActionLoading(true);
      await api.approveTimeLog(id, "APPROVED");
      toast.success("Timesheet entry approved");
      loadData();
      if (inspectLog?.id === id) setInspectLog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve entry");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    if (!rejectionReason.trim()) {
      return toast.error("Please provide a rejection reason comment");
    }
    try {
      setActionLoading(true);
      await api.approveTimeLog(id, "REJECTED", rejectionReason);
      toast.success("Timesheet entry rejected");
      loadData();
      setInspectLog(null);
      setRejectionReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject entry");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await api.bulkApproveTimeLogs(selectedIds, "APPROVED");
      toast.success(`Approved ${selectedIds.length} timesheet entries`);
      loadData();
    } catch (err) {
      toast.error("Failed to bulk approve timesheets");
    } finally {
      setActionLoading(false);
    }
  }

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const name = `${l.user?.firstName || ""} ${l.user?.lastName || ""}`.toLowerCase();
    const proj = (l.project?.name || "").toLowerCase();
    return name.includes(search.toLowerCase()) || proj.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">Team Timesheet Approvals</h2>
          <p className="text-xs text-text-tertiary">
            Review and approve team members' submitted time logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            className="h-9 rounded-md border border-border-base bg-surface px-3 text-xs font-bold text-text-primary focus:border-brand focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="SUBMITTED">Pending Submission</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Statuses</option>
          </select>

          {/* Bulk Approve */}
          {selectedIds.length > 0 && (
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="h-9 text-xs bg-success text-white hover:bg-success/90 font-semibold gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCheck className="h-4 w-4" /> Approve Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border-base flex items-center justify-between gap-3 bg-surface-subtle/20">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <input
              className="w-full h-8 pl-8 pr-3 bg-surface border border-border-base rounded-md text-xs focus:border-brand focus:outline-none"
              placeholder="Search employee or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="text-xs text-text-tertiary font-mono">
            Showing {filteredLogs.length} Team Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border-base"
                    checked={selectedIds.length === filteredLogs.length && filteredLogs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredLogs.map((l) => l.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Project / Task</th>
                <th className="py-3 px-6">Hours</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-tertiary">
                    Loading team timesheets...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-tertiary">
                    No team timesheets found matching filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const empName = `${log.user?.firstName || ""} ${log.user?.lastName || ""}`.trim() || log.user?.email || "Employee";
                  const initials = empName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  const isChecked = selectedIds.includes(log.id);

                  return (
                    <tr key={log.id} className="hover:bg-surface-subtle/30 transition-colors group">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-border-base cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, log.id]);
                            else setSelectedIds((prev) => prev.filter((id) => id !== log.id));
                          }}
                        />
                      </td>

                      <td className="py-3 px-6 flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border-base shrink-0">
                          <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-text-primary">{empName}</p>
                          <p className="text-[10px] text-text-tertiary">
                            {log.user?.department?.name || "Member"}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-6 font-mono font-semibold text-text-tertiary">
                        {new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
                      </td>

                      <td className="py-3 px-6">
                        <p className="font-semibold text-text-primary">{log.project ? log.project.name : "Unassigned"}</p>
                        {log.task && (
                          <span className="text-[10px] text-text-tertiary block font-mono">
                            Task: {log.task.title}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6 font-mono font-bold text-text-primary">
                        <div>{formatDuration(log.hours, log.durationSec)}</div>
                        <span className="text-[10px] text-text-tertiary font-mono font-normal">
                          ({log.hours.toFixed(2)}h)
                        </span>
                        {log.isOvertime && (
                          <span className="text-[9px] text-info block font-mono">
                            Overtime
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusBadge(log.status))}>
                          {log.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-6 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleApprove(log.id)}
                          className="h-7 w-7 text-text-tertiary hover:text-success cursor-pointer"
                          title="Approve Entry"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setInspectLog(log);
                            setRejectionReason("");
                          }}
                          className="h-7 w-7 text-text-tertiary hover:text-error cursor-pointer"
                          title="Reject / Inspect"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setInspectLog(log)}
                          className="h-7 w-7 text-text-tertiary hover:text-info cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect & Reject Drawer */}
      <Sheet open={Boolean(inspectLog)} onOpenChange={(open) => !open && setInspectLog(null)}>
        {inspectLog && (
          <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base shadow-2xl">
            <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/30 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusBadge(inspectLog.status))}>
                  {inspectLog.status}
                </Badge>
                <span className="font-mono text-xs text-text-tertiary">
                  ID: {inspectLog.id}
                </span>
              </div>

              <SheetTitle className="font-heading text-base font-bold text-text-primary">
                Timesheet Detail Breakdown
              </SheetTitle>
              <SheetDescription className="text-xs text-text-tertiary">
                Submitted by {inspectLog.user?.firstName} {inspectLog.user?.lastName} ({inspectLog.user?.email})
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/30 space-y-2">
                <div className="flex justify-between py-1 border-b border-border-base/50">
                  <span className="text-text-tertiary">Project:</span>
                  <span className="font-bold text-text-primary">{inspectLog.project ? inspectLog.project.name : "Unassigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-base/50">
                  <span className="text-text-tertiary">Date:</span>
                  <span className="font-bold text-text-primary">{new Date(inspectLog.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-base/50">
                  <span className="text-text-tertiary">Duration:</span>
                  <span className="font-bold text-text-primary">{inspectLog.hours.toFixed(1)} Hours</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-tertiary">Billable:</span>
                  <span className="font-bold text-text-primary">{inspectLog.isBillable ? "Yes" : "No"}</span>
                </div>
              </div>

              {inspectLog.description && (
                <div className="space-y-1">
                  <label className="font-semibold text-text-primary uppercase font-sans text-[11px]">Employee Notes</label>
                  <div className="p-3 rounded-lg border border-border-base bg-surface text-text-primary font-sans text-xs">
                    <RichTextViewer content={inspectLog.description} />
                  </div>
                </div>
              )}

              {/* Rejection Form */}
              <div className="space-y-2 pt-2 border-t border-border-base">
                <label className="font-semibold text-text-primary uppercase font-sans text-[11px] text-error flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Rejection Comment / Reason
                </label>
                <textarea
                  className="w-full p-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs font-sans focus:border-error focus:outline-none resize-none"
                  rows={3}
                  placeholder="Explain why this entry is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 border-t border-border-base flex items-center justify-end gap-2 bg-surface-subtle/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(inspectLog.id)}
                disabled={actionLoading}
                className="h-9 text-xs border-error text-error hover:bg-error/10 font-bold cursor-pointer"
              >
                Reject Entry
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(inspectLog.id)}
                disabled={actionLoading}
                className="h-9 text-xs bg-success hover:bg-success/90 text-white font-bold cursor-pointer"
              >
                Approve Entry
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
