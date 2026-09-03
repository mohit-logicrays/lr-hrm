"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api, type TimeLog, type TimesheetSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddTimeEntrySheet } from "./AddTimeEntrySheet";
import { SmartTimeTrackerWidget } from "@/components/dashboard/widgets/SmartTimeTrackerWidget";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Zap,
  FolderKanban,
  Coffee,
} from "lucide-react";
import { cn, formatDuration, formatSecondsToHMS } from "@/lib/utils";

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

  // Multi-view state: "list" | "grid" | "timeline"
  const [viewMode, setViewMode] = useState<"list" | "grid" | "timeline">("list");
  const [timelineGroupBy, setTimelineGroupBy] = useState<"day" | "project">("day");

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

      {/* Live Timer Widget (Collapsible & Synced with Dashboard) */}
      {showTimer && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <SmartTimeTrackerWidget onLogSaved={loadData} />
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

      {/* Main Timesheet Container with Multi-View Switcher (List, Grid, Timeline) */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border-base flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-subtle/30">
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider">
              Time Entries ({dateRangeLabel})
            </h3>
            <span className="text-xs font-mono font-bold text-brand">
              Weekly: {logs.reduce((acc, curr) => acc + (curr.hours || 0), 0).toFixed(1)} hrs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Group-By Selector (Only visible in Timeline view) */}
            {viewMode === "timeline" && (
              <div className="flex items-center bg-surface border border-border-base rounded-lg p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimelineGroupBy("day")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                    timelineGroupBy === "day"
                      ? "bg-brand text-white font-bold shadow-2xs"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  By Day
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineGroupBy("project")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                    timelineGroupBy === "project"
                      ? "bg-brand text-white font-bold shadow-2xs"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  By Project
                </button>
              </div>
            )}

            {/* View Mode Toggle Switch (List | Grid | Timeline) */}
            <div className="flex items-center bg-surface border border-border-base rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-brand text-white font-bold shadow-2xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
                title="Table List View"
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-brand text-white font-bold shadow-2xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
                title="Bento Grid Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  viewMode === "timeline"
                    ? "bg-brand text-white font-bold shadow-2xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
                title="Visual Timeline View"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Timeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. LIST VIEW */}
        {viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle/40 border-b border-border-base text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Project / Task</th>
                  <th className="py-3 px-6">Duration</th>
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
        )}

        {/* 2. GRID VIEW */}
        {viewMode === "grid" && (
          <div className="p-5">
            {loading ? (
              <div className="py-12 text-center text-text-tertiary text-xs">Loading grid view...</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-text-tertiary text-xs">No time entries logged for this week.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logs.map((log) => {
                  const logDateStr = new Date(log.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "2-digit",
                  });
                  const isEditable = log.status === "DRAFT" || log.status === "REJECTED";

                  return (
                    <Card
                      key={log.id}
                      className="p-4 border border-border-base bg-surface hover:shadow-md transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-text-tertiary block">
                            {logDateStr}
                          </span>
                          <h4 className="font-heading text-sm font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-brand" />
                            {log.project ? log.project.name : "Unassigned Project"}
                          </h4>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-2 py-0.5 font-bold uppercase", getStatusBadge(log.status))}
                        >
                          {log.status}
                        </Badge>
                      </div>

                      {log.task && (
                        <div className="text-[11px] text-text-secondary bg-surface-subtle/50 px-2.5 py-1.5 rounded-lg border border-border-base/50 font-mono">
                          Task: <strong>{log.task.title}</strong>
                        </div>
                      )}

                      {log.description && (
                        <div className="text-xs text-text-tertiary line-clamp-2">
                          <RichTextViewer content={log.description} />
                        </div>
                      )}

                      <div className="pt-2 border-t border-border-base/50 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-base font-extrabold text-brand">
                            {formatDuration(log.hours, log.durationSec)}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-mono ml-1">
                            ({log.hours.toFixed(2)}h)
                          </span>
                        </div>

                        {isEditable && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingLog(log);
                                setIsAddOpen(true);
                              }}
                              className="h-7 w-7 text-text-tertiary hover:text-brand"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(log.id)}
                              className="h-7 w-7 text-text-tertiary hover:text-error"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. TIMELINE VIEW (PER-DAY AND PER-PROJECT) */}
        {viewMode === "timeline" && (
          <div className="p-5 space-y-6">
            {loading ? (
              <div className="py-12 text-center text-text-tertiary text-xs">Loading timeline view...</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-text-tertiary text-xs">No time entries logged for this week.</div>
            ) : timelineGroupBy === "day" ? (
              /* GROUP BY DAY */
              <div className="space-y-6">
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayDate = new Date(currentWeekStart);
                  dayDate.setDate(dayDate.getDate() + i);
                  const dateKey = dayDate.toISOString().split("T")[0];
                  const dayLogs = logs.filter((l) => l.date.startsWith(dateKey));
                  const dayTotalHours = dayLogs.reduce((acc, l) => acc + (l.hours || 0), 0);
                  const isToday = new Date().toISOString().split("T")[0] === dateKey;

                  return (
                    <div key={dateKey} className="border border-border-base rounded-xl p-4 bg-surface space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border-base/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-bold font-heading px-2 py-0.5 rounded-md",
                              isToday ? "bg-brand text-white" : "bg-surface-subtle text-text-primary"
                            )}
                          >
                            {dayDate.toLocaleDateString(undefined, { weekday: "long" })}
                          </span>
                          <span className="text-xs text-text-tertiary font-mono">
                            {dayDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-brand">
                          {dayTotalHours > 0 ? `${dayTotalHours.toFixed(2)} hrs` : "0.0 hrs"}
                        </span>
                      </div>

                      {dayLogs.length === 0 ? (
                        <p className="text-xs text-text-tertiary italic py-1">No activities logged for this day.</p>
                      ) : (
                        <div className="space-y-2 relative pl-4 border-l-2 border-brand/20 ml-2">
                          {dayLogs.map((log) => (
                            <div
                              key={log.id}
                              className="relative group p-3 bg-surface-subtle/50 hover:bg-surface-subtle rounded-lg border border-border-base/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                            >
                              <div className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-surface" />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-text-primary">
                                    {log.project ? log.project.name : "Unassigned"}
                                  </span>
                                  {log.task && (
                                    <span className="text-[10px] font-mono text-text-tertiary">
                                      • {log.task.title}
                                    </span>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[9px] px-1.5 py-0 font-bold", getStatusBadge(log.status))}
                                  >
                                    {log.status}
                                  </Badge>
                                </div>
                                {log.description && (
                                  <div className="text-[11px] text-text-tertiary line-clamp-1">
                                    <RichTextViewer content={log.description} />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center font-mono shrink-0">
                                <span className="font-bold text-xs text-text-primary">
                                  {formatDuration(log.hours, log.durationSec)}
                                </span>
                                {(log.status === "DRAFT" || log.status === "REJECTED") && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => {
                                        setEditingLog(log);
                                        setIsAddOpen(true);
                                      }}
                                      className="h-6 w-6 text-text-tertiary hover:text-brand"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => handleDelete(log.id)}
                                      className="h-6 w-6 text-text-tertiary hover:text-error"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* GROUP BY PROJECT */
              <div className="space-y-5">
                {Array.from(
                  new Set(logs.map((l) => (l.project ? l.project.name : "Unassigned Project")))
                ).map((projectName) => {
                  const projectLogs = logs.filter(
                    (l) => (l.project ? l.project.name : "Unassigned Project") === projectName
                  );
                  const projectTotalHours = projectLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

                  return (
                    <div key={projectName} className="border border-border-base rounded-xl p-4 bg-surface space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border-base/60">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-brand" />
                          <h4 className="font-heading text-sm font-bold text-text-primary">{projectName}</h4>
                          <span className="text-[11px] text-text-tertiary font-mono">({projectLogs.length} entries)</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-brand">
                          Total: {projectTotalHours.toFixed(2)} hrs
                        </span>
                      </div>

                      <div className="space-y-2 relative pl-4 border-l-2 border-brand/20 ml-2">
                        {projectLogs.map((log) => {
                          const dateStr = new Date(log.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          });

                          return (
                            <div
                              key={log.id}
                              className="relative group p-3 bg-surface-subtle/50 hover:bg-surface-subtle rounded-lg border border-border-base/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                            >
                              <div className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-surface" />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-text-primary">{dateStr}</span>
                                  {log.task && (
                                    <span className="text-[11px] font-mono text-text-tertiary">
                                      • Task: {log.task.title}
                                    </span>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[9px] px-1.5 py-0 font-bold", getStatusBadge(log.status))}
                                  >
                                    {log.status}
                                  </Badge>
                                </div>
                                {log.description && (
                                  <div className="text-[11px] text-text-tertiary line-clamp-1">
                                    <RichTextViewer content={log.description} />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center font-mono shrink-0">
                                <span className="font-bold text-xs text-text-primary">
                                  {formatDuration(log.hours, log.durationSec)}
                                </span>
                                {(log.status === "DRAFT" || log.status === "REJECTED") && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => {
                                        setEditingLog(log);
                                        setIsAddOpen(true);
                                      }}
                                      className="h-6 w-6 text-text-tertiary hover:text-brand"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => handleDelete(log.id)}
                                      className="h-6 w-6 text-text-tertiary hover:text-error"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
