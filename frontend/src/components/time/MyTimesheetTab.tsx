"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api, type TimeLog, type TimesheetSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddTimeEntrySheet } from "./AddTimeEntrySheet";
import { StartStopTimerWidget } from "./StartStopTimerWidget";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-success/10 text-success border-success/30";
    case "SUBMITTED":
    case "PENDING":
      return "bg-info/10 text-info border-info/30";
    case "REJECTED":
      return "bg-error/10 text-error border-error/30";
    case "DRAFT":
    default:
      return "bg-surface-subtle text-text-tertiary border-border-base";
  }
}

export function MyTimesheetTab() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingWeek, setSubmittingWeek] = useState(false);

  // Week Selector State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  });

  // Sheet States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const fromStr = currentWeekStart.toISOString().split("T")[0];
  const toStr = weekEnd.toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [logsRes, summaryRes] = await Promise.all([
        api.listMyTimeLogs(1, 100, { from: fromStr, to: toStr }),
        api.getMyTimesheetSummary(fromStr, toStr),
      ]);
      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error("Failed to load timesheet data");
    } finally {
      setLoading(false);
    }
  }, [fromStr, toStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handlePrevWeek() {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  }

  function handleNextWeek() {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  }

  async function handleSubmitWeek() {
    try {
      setSubmittingWeek(true);
      const res = await api.submitWeekTimesheet(fromStr, toStr);
      toast.success(`Submitted ${res.submittedCount} draft time logs for manager review!`);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit week timesheet");
    } finally {
      setSubmittingWeek(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this draft time log?")) return;
    try {
      await api.deleteTimeLog(id);
      toast.success("Time log entry deleted");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  async function handleTimerSave(date: string, hours: number, projectId: string, description: string) {
    try {
      await api.createTimeLog({
        date: new Date(date).toISOString(),
        hours,
        projectId: projectId || null,
        description,
        status: "DRAFT",
      });
      toast.success(`Saved ${hours}h live timer log as Draft`);
      loadData();
    } catch (err) {
      toast.error("Failed to save timer entry");
    }
  }

  const dateRangeLabel = `${currentWeekStart.toLocaleDateString(undefined, { month: "short", day: "2-digit" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      {/* Week Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">My Timesheet</h2>
          <p className="text-xs text-text-tertiary">
            Review, track, and submit your weekly working hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center rounded-lg border border-border-base bg-surface p-1 shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevWeek}
              className="h-7 w-7 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 font-mono text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand" /> {dateRangeLabel}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextWeek}
              className="h-7 w-7 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimer((prev) => !prev)}
            className="h-9 text-xs gap-1.5 border-brand/30 text-brand hover:bg-brand/5 cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5" /> Stopwatch Timer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitWeek}
            disabled={submittingWeek || !logs.some((l) => l.status === "DRAFT" || l.status === "REJECTED")}
            className="h-9 text-xs gap-1.5 border-brand text-brand hover:bg-brand/10 font-bold cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Submit Week
          </Button>

          <Button
            onClick={() => {
              setEditingLog(null);
              setIsAddOpen(true);
            }}
            className="h-9 text-xs bg-brand hover:bg-brand-hover text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Time Entry
          </Button>
        </div>
      </div>

      {/* Live Timer Widget (Collapsible) */}
      {showTimer && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <StartStopTimerWidget onSaveLog={handleTimerSave} />
        </motion.div>
      )}

      {/* 4 Bento Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={cardVariants} whileHover={{ y: -2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Total Hours
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {summary ? `${summary.totalHours}h` : "0.0h"}
              </span>
              <p className="text-[11px] text-text-tertiary mt-0.5">Recorded for this week</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover={{ y: -2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Billable Hours
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {summary ? `${summary.billableHours}h` : "0.0h"}
              </span>
              <p className="text-[11px] text-success font-semibold mt-0.5">Client billable work</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover={{ y: -2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Pending Approval
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {summary ? `${summary.pendingHours}h` : "0.0h"}
              </span>
              <p className="text-[11px] text-warning font-semibold mt-0.5">Awaiting lead review</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover={{ y: -2 }}>
          <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Overtime Hours
              </span>
            </div>
            <div>
              <span className="font-heading text-3xl font-extrabold text-text-primary">
                {summary ? `${summary.overtimeHours}h` : "0.0h"}
              </span>
              <p className="text-[11px] text-info font-semibold mt-0.5">Premium rate applies</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Timesheet Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border-base flex justify-between items-center bg-surface-subtle/30">
          <h3 className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider">
            Daily Time Entries ({dateRangeLabel})
          </h3>
          <span className="text-xs font-mono font-bold text-brand">
            Weekly Total: {logs.reduce((acc, curr) => acc + (curr.hours || 0), 0).toFixed(1)} hrs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Project / Task</th>
                <th className="py-3 px-6">Hours</th>
                <th className="py-3 px-6">Billable</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-tertiary">
                    Loading weekly timesheet entries...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-tertiary">
                    No time entries logged for this week yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const logDateStr = new Date(log.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "2-digit",
                  });
                  const isEditable = log.status === "DRAFT" || log.status === "REJECTED";

                  return (
                    <tr key={log.id} className="hover:bg-surface-subtle/30 transition-colors group">
                      <td className="py-3 px-6 font-mono font-semibold text-text-primary">
                        {logDateStr}
                      </td>

                      <td className="py-3 px-6">
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                          <span>{log.project ? log.project.name : "Unassigned Project"}</span>
                        </div>
                        {log.task && (
                          <span className="text-[11px] text-text-tertiary block font-mono pl-4">
                            Task: {log.task.title}
                          </span>
                        )}
                        {log.description && (
                          <div className="text-[11px] text-text-tertiary line-clamp-1 pl-4">
                            <RichTextViewer content={log.description} />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-6 font-mono font-bold text-text-primary">
                        <div>{formatDuration(log.hours, log.durationSec)}</div>
                        <span className="text-[10px] text-text-tertiary font-mono font-normal">
                          ({log.hours.toFixed(2)}h)
                        </span>
                        {log.isOvertime && (
                          <span className="text-[10px] text-info block font-mono font-normal">
                            Overtime
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6 font-mono text-text-tertiary">
                        {log.isBillable ? (
                          <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/30">
                            Billable
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] bg-surface-subtle text-text-tertiary">
                            Non-Billable
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-6">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusBadge(log.status))}
                          title={log.rejectionReason ? `Reason: ${log.rejectionReason}` : undefined}
                        >
                          {log.status}
                        </Badge>
                        {log.rejectionReason && (
                          <span className="text-[10px] text-error block line-clamp-1 mt-0.5">
                            Reason: {log.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right">
                        {isEditable ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingLog(log);
                                setIsAddOpen(true);
                              }}
                              className="h-7 w-7 text-text-tertiary hover:text-brand cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(log.id)}
                              className="h-7 w-7 text-text-tertiary hover:text-error cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-tertiary font-mono">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over Drawer for Add/Edit Entry */}
      <AddTimeEntrySheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingLog(null);
        }}
        onSuccess={loadData}
        initialLog={editingLog}
      />
    </div>
  );
}
