"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { api, type Project, type Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Play,
  Square,
  Pause,
  Timer,
  Clock,
  RotateCcw,
  AlertCircle,
  Coffee,
  Info,
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

  // Long-Session Review / Break Adjustment Dialog State
  const [showLongSessionModal, setShowLongSessionModal] = useState(false);
  const [suggestedBreakMinutes, setSuggestedBreakMinutes] = useState(30);
  const [customTrackMinutes, setCustomTrackMinutes] = useState<number>(120);

  // Ref to track last sync timestamp to avoid flooding backend
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Load persisted timer directly from database on mount & on page focus
  const loadDbTimer = useCallback(async () => {
    try {
      const res = await api.getActiveTimer();
      const dbTimer = res.data;
      if (dbTimer) {
        setMode((dbTimer.mode as any) || "countdown");
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
  }, [defaultDurationSeconds]);

  useEffect(() => {
    loadDbTimer();
  }, [loadDbTimer]);

  // Window Focus / Visibility Change Listener to auto-refresh state from DB when returning to tab/page
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadDbTimer();
      }
    }
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", loadDbTimer);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", loadDbTimer);
    };
  }, [loadDbTimer]);

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

  function handleStopTrigger() {
    if (elapsedSeconds <= 0) {
      toast.warning("Please start the timer first");
      return;
    }

    // If session is unusually long (>= 3 hours / 10,800 seconds), open deduction modal
    if (elapsedSeconds >= 10800) {
      const totalMinutes = Math.round(elapsedSeconds / 60);
      setSuggestedBreakMinutes(30);
      setCustomTrackMinutes(Math.max(1, totalMinutes - 30));
      setShowLongSessionModal(true);
      return;
    }

    executeSaveTimeLog(elapsedSeconds);
  }

  async function executeSaveTimeLog(durationSec: number) {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const finalSec = Math.max(1, durationSec);
    const calculatedHours = Number((finalSec / 3600).toFixed(4));

    try {
      await api.createTimeLog({
        date: today,
        durationSec: finalSec,
        hours: calculatedHours,
        projectId: selectedProjectId || undefined,
        taskId: selectedTaskId || undefined,
        description: description || "Smart Focus Timer session",
        isBillable: true,
      });

      toast.success(`Logged ${formatSecondsToHMS(finalSec)} successfully`);
      setIsRunning(false);
      setRemainingSeconds(defaultDurationSeconds);
      setElapsedSeconds(0);
      setDescription("");
      setShowLongSessionModal(false);
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
  const progressPercent =
    mode === "countdown"
      ? Math.min(100, Math.max(0, ((defaultDurationSeconds - remainingSeconds) / defaultDurationSeconds) * 100))
      : Math.min(100, (elapsedSeconds / 7200) * 100);

  const isLongSession = elapsedSeconds >= 10800;

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
                {isRunning && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Select project & task, add description, and start timer. Timer stays synced across dashboard and timesheets.
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
                disabled={isRunning}
                onClick={() => {
                  const nextMode = mode === "countdown" ? "stopwatch" : "countdown";
                  setMode(nextMode);
                  syncToDatabase(isRunning);
                }}
                className={cn(
                  "text-[10px] font-semibold underline cursor-pointer",
                  isRunning ? "opacity-50 cursor-not-allowed text-text-tertiary" : "text-text-tertiary hover:text-text-primary"
                )}
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

        {/* Long running warning alert */}
        {isLongSession && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-2.5 text-xs text-warning-foreground">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Long timer session detected (3+ hours)</p>
              <p className="text-[11px] text-text-tertiary">
                Don&apos;t worry if you forgot to stop the timer! When you click <strong>Stop & Save</strong>, you can deduct break times or adjust exact working hours before saving.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-base">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-text-secondary">Project *</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                syncToDatabase(isRunning);
              }}
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
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                syncToDatabase(isRunning);
              }}
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
              onBlur={() => syncToDatabase(isRunning)}
              placeholder="What are you working on?"
              className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Note to user about breaks + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border-base/60">
          <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
            <Info className="h-3.5 w-3.5 text-brand shrink-0" />
            <span>
              <strong>Review & break reminder:</strong> Extended uninterrupted tracking (&ge;3h) will prompt you to deduct break intervals when stopping.
            </span>
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
              onClick={handleStopTrigger}
              className="text-xs h-8 px-4 gap-1.5 font-semibold border-brand text-brand hover:bg-brand/10 cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" /> {saving ? "Saving..." : "Stop & Save"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Long-Session Break Adjustment Modal */}
      <Dialog open={showLongSessionModal} onOpenChange={setShowLongSessionModal}>
        <DialogContent className="sm:max-w-md bg-surface border-border-base">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-text-primary text-base">
              <Coffee className="h-5 w-5 text-warning" />
              Adjust Long Session & Deduct Breaks
            </DialogTitle>
            <DialogDescription className="text-xs text-text-tertiary">
              This timer ran for <strong>{formatSecondsToHMS(elapsedSeconds)}</strong>. If you forgot to stop the timer or took lunch/breaks, adjust the logged duration below:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-surface-subtle border border-border-base rounded-xl space-y-2">
              <div className="flex justify-between items-center text-text-secondary font-medium">
                <span>Total Elapsed Time:</span>
                <span className="font-mono font-bold text-text-primary">{formatSecondsToHMS(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary font-medium">
                <span>Total Raw Hours:</span>
                <span className="font-mono font-bold text-text-primary">{(elapsedSeconds / 3600).toFixed(2)}h</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-text-primary block">Quick Break Deduction:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "No Break", breakMin: 0 },
                  { label: "15 min", breakMin: 15 },
                  { label: "30 min", breakMin: 30 },
                  { label: "1 hour", breakMin: 60 },
                ].map((item) => (
                  <button
                    key={item.breakMin}
                    type="button"
                    onClick={() => {
                      setSuggestedBreakMinutes(item.breakMin);
                      const totalMin = Math.round(elapsedSeconds / 60);
                      setCustomTrackMinutes(Math.max(1, totalMin - item.breakMin));
                    }}
                    className={cn(
                      "py-2 px-2 rounded-lg border text-center font-medium transition-all cursor-pointer text-xs",
                      suggestedBreakMinutes === item.breakMin
                        ? "border-brand bg-brand/10 text-brand font-bold"
                        : "border-border-base bg-surface hover:bg-surface-subtle text-text-secondary"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-text-primary block">
                Net Working Minutes to Log:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={Math.round(elapsedSeconds / 60)}
                  value={customTrackMinutes}
                  onChange={(e) => setCustomTrackMinutes(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-border-base bg-surface px-3 text-xs text-text-primary font-mono focus:border-brand focus:outline-none"
                />
                <span className="font-mono text-xs font-bold text-brand shrink-0">
                  ≈ {(customTrackMinutes / 60).toFixed(2)} hrs
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLongSessionModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => executeSaveTimeLog(customTrackMinutes * 60)}
              disabled={saving}
              className="bg-brand text-white hover:bg-brand-hover text-xs font-semibold"
            >
              {saving ? "Saving..." : `Confirm & Log ${(customTrackMinutes / 60).toFixed(2)}h`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
