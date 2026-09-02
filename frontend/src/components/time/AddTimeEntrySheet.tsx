"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type Project, type Task, type TimeLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Calendar, Clock, DollarSign, FileText, Folder, CheckSquare } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";

interface AddTimeEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLog?: TimeLog | null;
  defaultDate?: string;
  defaultHours?: number;
}

export function AddTimeEntrySheet({
  isOpen,
  onClose,
  onSuccess,
  initialLog,
  defaultDate,
  defaultHours,
}: AddTimeEntrySheetProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [projectId, setProjectId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [hours, setHours] = useState<number>(8.0);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isBillable, setIsBillable] = useState<boolean>(true);

  // Load Projects & Tasks
  useEffect(() => {
    if (!isOpen) return;

    async function loadProjects() {
      try {
        setLoading(true);
        const res = await api.listProjects(1, 100, "", undefined, undefined, undefined, undefined, undefined, true);
        setProjects(res.data || []);
      } catch (err) {
        toast.error("Failed to load projects list");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [isOpen]);

  // Populate fields on edit or open
  useEffect(() => {
    if (initialLog) {
      setDate(
        initialLog.date ? new Date(initialLog.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setProjectId(initialLog.projectId || "");
      setTaskId(initialLog.taskId || "");
      setHours(initialLog.hours || 8.0);
      setStartTime(
        initialLog.startTime ? new Date(initialLog.startTime).toTimeString().substring(0, 5) : ""
      );
      setEndTime(
        initialLog.endTime ? new Date(initialLog.endTime).toTimeString().substring(0, 5) : ""
      );
      setDescription(initialLog.description || "");
      setIsBillable(initialLog.isBillable ?? true);
    } else {
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setProjectId("");
      setTaskId("");
      setHours(defaultHours || 8.0);
      setStartTime("");
      setEndTime("");
      setDescription("");
      setIsBillable(true);
    }
  }, [initialLog, defaultDate, defaultHours, isOpen]);

  // Fetch tasks when project changes
  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    async function loadTasks() {
      try {
        const res = await api.listTasks(projectId);
        setTasks(res.data || []);
      } catch (err) {
        setTasks([]);
      }
    }
    loadTasks();
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return toast.error("Date is required");
    if (!hours || hours <= 0) return toast.error("Valid hours required");

    try {
      setSubmitting(true);

      let fullStart: string | undefined = undefined;
      let fullEnd: string | undefined = undefined;

      if (startTime) {
        fullStart = new Date(`${date}T${startTime}:00`).toISOString();
      }
      if (endTime) {
        fullEnd = new Date(`${date}T${endTime}:00`).toISOString();
      }

      const payload = {
        projectId: projectId || null,
        taskId: taskId || null,
        date: new Date(date).toISOString(),
        startTime: fullStart,
        endTime: fullEnd,
        hours: Number(hours),
        isBillable,
        description: description || null,
        status: "DRAFT" as const,
      };

      if (initialLog) {
        await api.updateTimeLog(initialLog.id, payload);
        toast.success("Timesheet entry updated");
      } else {
        await api.createTimeLog(payload);
        toast.success("Time entry saved as Draft");
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save time entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-surface p-0 flex flex-col h-full border-l border-border-base shadow-2xl">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border-base bg-surface-subtle/30 space-y-1">
          <SheetTitle className="font-heading text-lg font-bold text-text-primary">
            {initialLog ? "Edit Time Entry" : "Add Time Entry"}
          </SheetTitle>
          <SheetDescription className="text-xs text-text-tertiary">
            Record hours worked on projects and tasks.
          </SheetDescription>
        </SheetHeader>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand" /> Date <span className="text-brand">*</span>
            </label>
            <input
              type="date"
              className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-brand" /> Project
            </label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTaskId("");
              }}
            >
              <option value="">Select a project (Optional)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Task */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-brand" /> Task
            </label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={!projectId || tasks.length === 0}
            >
              <option value="">Select task (Optional)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Hours */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand" /> Duration (Hours) <span className="text-brand">*</span>
            </label>
            <input
              type="number"
              step="0.25"
              min="0.1"
              max="24"
              className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
              placeholder="e.g. 7.5"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              required
            />
          </div>

          {/* Optional Start - End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-text-tertiary text-[11px]">Start Time (Optional)</label>
              <input
                type="time"
                className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-text-tertiary text-[11px]">End Time (Optional)</label>
              <input
                type="time"
                className="w-full h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description (Tiptap RichTextEditor) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-brand" /> Description
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe work completed in detail..."
            />
          </div>

          {/* Billable Toggle */}
          <div className="p-3.5 rounded-xl border border-border-base bg-surface-subtle/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-success" /> Billable Entry
              </span>
              <p className="text-[10px] text-text-tertiary">
                Mark if these hours are billable to the client.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand cursor-pointer"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-base flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 text-xs bg-brand hover:bg-brand-hover text-white px-4 font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? "Saving..." : initialLog ? "Save Changes" : "Save Entry"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
