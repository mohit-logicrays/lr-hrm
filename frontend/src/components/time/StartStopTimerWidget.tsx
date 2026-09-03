"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Pause, Timer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartStopTimerWidgetProps {
  onSaveLog: (date: string, hours: number, projectId: string, description: string) => void;
}

export function StartStopTimerWidget({ onSaveLog }: StartStopTimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await api.listProjects(1, 50, "", undefined, undefined, undefined, undefined, undefined, true);
        setProjects(res.data || []);
      } catch (err) {
        // Silent catch
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  function formatTimer(totalSecs: number) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleStart() {
    setIsRunning(true);
    toast.info("Stopwatch timer started");
  }

  function handlePause() {
    setIsRunning(false);
    toast.info("Timer paused");
  }

  function handleStopAndSave() {
    setIsRunning(false);
    if (seconds <= 0) {
      toast.warning("Please start the timer first");
      return;
    }

    const calculatedHours = Number((seconds / 3600).toFixed(4));
    const today = new Date().toISOString().split("T")[0];

    onSaveLog(today, calculatedHours, selectedProjectId, description || "Live Timer Entry");
    setSeconds(0);
    setDescription("");
  }

  return (
    <Card className="p-4 border border-brand/30 bg-brand/5 rounded-xl shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold">
            <Timer className={cn("h-4 w-4", isRunning && "animate-pulse")} />
          </div>
          <div>
            <h4 className="font-heading text-xs font-bold text-text-primary">Live Stopwatch Timer</h4>
            <p className="text-[10px] text-text-tertiary">Track tasks in real time</p>
          </div>
        </div>

        <div className="font-mono text-xl font-extrabold text-brand tracking-wider">
          {formatTimer(seconds)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <select
          className="h-8 rounded-md border border-border-base bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none cursor-pointer"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="h-8 px-2 rounded-md border border-border-base bg-surface text-xs text-text-primary focus:border-brand focus:outline-none"
          placeholder="Activity description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {!isRunning ? (
          <Button
            size="xs"
            onClick={handleStart}
            className="bg-brand text-white hover:bg-brand-hover text-[11px] h-7 gap-1 font-semibold cursor-pointer"
          >
            <Play className="h-3 w-3 fill-current" /> Start Timer
          </Button>
        ) : (
          <Button
            size="xs"
            variant="outline"
            onClick={handlePause}
            className="text-[11px] h-7 gap-1 font-semibold cursor-pointer border-warning text-warning"
          >
            <Pause className="h-3 w-3" /> Pause
          </Button>
        )}

        <Button
          size="xs"
          variant="outline"
          disabled={seconds === 0}
          onClick={handleStopAndSave}
          className="text-[11px] h-7 gap-1 font-semibold border-brand text-brand hover:bg-brand/10 cursor-pointer"
        >
          <Square className="h-3 w-3 fill-current" /> Save Entry
        </Button>
      </div>
    </Card>
  );
}
