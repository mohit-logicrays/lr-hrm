"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { api, type Project, type Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Square,
  Pause,
  Timer,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn, formatSecondsToHMS } from "@/lib/utils";

export interface SmartTimeTrackerWidgetProps {
  variants?: Variants;
  defaultDurationSeconds?: number;
  onLogSaved?: () => void;
}

export function SmartTimeTrackerWidget({
  variants,
  defaultDurationSeconds = 7200, // 2 Hours default
  onLogSaved,
}: SmartTimeTrackerWidgetProps) {
  const STORAGE_KEY = "lr_smart_timer_state";

  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const [remainingSeconds, setRemainingSeconds] = useState(defaultDurationSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Load persisted timer directly from database on mount
  useEffect(() => {
    async function loadDbTimer() {
      try {
        const res = await api.getActiveTimer();
        const dbTimer = res.data;
        if (dbTimer) {
          setMode(dbTimer.mode as any || "countdown");
          setSelectedProjectId(dbTimer.projectId || "");
          setSelectedTaskId(dbTimer.taskId || "");
          setDescription(dbTimer.description || "");
          setElapsedSeconds(dbTimer.elapsedSeconds || 0);
          setRemainingSeconds(dbTimer.remainingSeconds ?? defaultDurationSeconds);
          setIsRunning(dbTimer.isRunning);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadDbTimer();
  }, [defaultDurationSeconds]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.listProjects(1, 50, "", undefined, undefined, undefined, undefined, undefined, true);
        setProjects(res.data || []);
      } catch {
        // Handled silently
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setSelectedTaskId("");
      return;
    }

    async function loadTasks() {
      try {
        const res = await api.getProject(selectedProjectId);
        setTasks(res.data?.tasks || []);
      } catch {
        setTasks([]);
      }
    }
    loadTasks();
  }, [selectedProjectId]);

  // Sync state to DB helper
  async function syncToDatabase(runningState: boolean, currentElapsed = elapsedSeconds, currentRemaining = remainingSeconds) {
    try {
      await api.syncActiveTimer({
        projectId: selectedProjectId || undefined,
        taskId: selectedTaskId || undefined,
        description: description || undefined,
        mode,
        targetSeconds: defaultDurationSeconds,
        elapsedSeconds: currentElapsed,
        remainingSeconds: currentRemaining,
        isRunning: runningState,
      });
    } catch {
      // Ignore background sync errors
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);

        if (mode === "countdown") {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              syncToDatabase(false, elapsedSeconds + 1, 0);
              toast.success("2-Hour Focus Countdown Completed! Save your timelog.");
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, elapsedSeconds]);

  function formatTime(totalSecs: number) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleStart() {
    if (!selectedProjectId) {
      toast.error("Please select a project before starting timer");
      return;
    }
    setIsRunning(true);
    await syncToDatabase(true);
    toast.info(mode === "countdown" ? "2-Hour Focus countdown started" : "Timer started");
  }

  async function handlePause() {
    setIsRunning(false);
    await syncToDatabase(false);
    toast.info("Timer paused");
  }

  async function handleReset() {
    setIsRunning(false);
    setRemainingSeconds(defaultDurationSeconds);
    setElapsedSeconds(0);
    try {
      await api.clearActiveTimer();
    } catch {}
    toast.info("Timer reset to 2 hours");
  }

  async function handleStopAndSave() {
    if (elapsedSeconds <= 0) {
      toast.warning("Please start the timer first");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const durationSec = Math.max(1, elapsedSeconds);
    const calculatedHours = Number((durationSec / 3600).toFixed(4));

    try {
      await api.createTimeLog({
        date: today,
        durationSec,
        hours: calculatedHours,
        projectId: selectedProjectId || undefined,
        taskId: selectedTaskId || undefined,
        description: description || "Smart Focus Timer session",
        isBillable: true,
      });

      toast.success(`Logged ${formatSecondsToHMS(durationSec)} successfully`);
      setIsRunning(false);
      setRemainingSeconds(defaultDurationSeconds);
      setElapsedSeconds(0);
      setDescription("");
      try {
        await api.clearActiveTimer();
      } catch {}
      if (onLogSaved) onLogSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save timelog");
    } finally {
      setSaving(false);
    }
  }

  const activeDisplayTime = mode === "countdown" ? remainingSeconds : elapsedSeconds;
  const progressPercent = mode === "countdown"
    ? Math.min(100, Math.max(0, ((defaultDurationSeconds - remainingSeconds) / defaultDurationSeconds) * 100))
    : Math.min(100, (elapsedSeconds / 7200) * 100);

  return (
    <motion.div variants={variants}>
      <Card className="p-5 md:p-6 border border-border-base bg-surface rounded-2xl shadow-xs relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-1 bg-brand transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-bold shrink-0">
              <Timer className={cn("h-6 w-6", isRunning && "animate-pulse")} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm md:text-base font-bold text-text-primary">
                  Smart Time Tracker
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand font-mono">
                  {mode === "countdown" ? "2h Focus Countdown" : "Stopwatch"}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Select project & task, add description, and start timer with 2-hour focus target.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface-subtle border border-border-base px-4 py-2 rounded-xl shadow-2xs">
              <span className="font-mono text-2xl md:text-3xl font-extrabold text-brand tracking-widest">
                {formatTime(activeDisplayTime)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setMode(mode === "countdown" ? "stopwatch" : "countdown")}
                className="text-[10px] text-text-tertiary hover:text-text-primary font-semibold underline cursor-pointer"
              >
                Switch to {mode === "countdown" ? "Stopwatch" : "Countdown"}
              </button>
              {elapsedSeconds > 0 && (
                <span className="text-[10px] text-text-secondary font-mono">
                  Elapsed: {formatTime(elapsedSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-base">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-text-secondary">Project *</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs font-medium text-text-primary focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-text-secondary">Task (Optional)</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={!selectedProjectId || tasks.length === 0}
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs font-medium text-text-primary focus:border-brand focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">{tasks.length === 0 ? "No tasks available" : "Select Task"}</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.taskCode ? `[${t.taskCode}] ` : ""}{t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-text-secondary">Task Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border-base/60">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Clock className="h-3.5 w-3.5 text-brand" />
            <span>Default target: <strong className="text-text-primary">2 Hours</strong> per focus block</span>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button
                size="sm"
                onClick={handleStart}
                className="bg-brand text-white hover:bg-brand-hover text-xs h-8 px-4 gap-1.5 font-semibold cursor-pointer shadow-xs"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Start Timer
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                className="text-xs h-8 px-4 gap-1.5 font-semibold cursor-pointer border-warning text-warning hover:bg-warning/10"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isRunning || elapsedSeconds === 0}
              className="text-xs h-8 px-3 gap-1 font-medium cursor-pointer border-border-base text-text-secondary hover:text-text-primary"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={saving || elapsedSeconds === 0}
              onClick={handleStopAndSave}
              className="text-xs h-8 px-4 gap-1.5 font-semibold border-brand text-brand hover:bg-brand/10 cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" /> {saving ? "Saving..." : "Stop & Save"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
