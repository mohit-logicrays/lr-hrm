"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { api, type Project, type ProjectStatus } from "@/lib/api";

const STATUS_CFG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-success", bg: "bg-success/10 border-success/30" },
  PLANNING: { label: "Planning", color: "text-info", bg: "bg-info/10 border-info/30" },
  ON_HOLD: { label: "On Hold", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  COMPLETED: { label: "Completed", color: "text-text-tertiary", bg: "bg-surface-subtle border-border-base" },
  ARCHIVED: { label: "Archived", color: "text-text-tertiary", bg: "bg-surface-subtle border-border-base" },
};

function progressColor(pct: number) {
  if (pct < 30) return "bg-error";
  if (pct < 70) return "bg-warning";
  return "bg-success";
}

export interface ProjectProgressWidgetProps {
  /** Only show projects with this status. Defaults to ACTIVE. */
  statusFilter?: ProjectStatus;
  limit?: number;
  title?: string;
  variants?: Variants;
}

/**
 * Shows project cards with name, status badge, progress bar, and due date.
 * Used on PM and Superadmin dashboards.
 */
export function ProjectProgressWidget({
  statusFilter = "ACTIVE",
  limit = 6,
  title = "Project Progress",
  variants,
}: ProjectProgressWidgetProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listProjects(1, 50, "", statusFilter)
      .then((res) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <motion.div variants={variants}>
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-brand" />
          <h2 className="font-heading font-bold text-base text-text-primary">{title}</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-surface-subtle rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-text-tertiary">No {statusFilter.toLowerCase()} projects found.</p>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, limit).map((proj) => {
              const cfg = STATUS_CFG[proj.status];
              const progress = proj.progress ?? 0;
              return (
                <div key={proj.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-text-primary truncate">{proj.name}</span>
                      {proj.code && (
                        <span className="text-[10px] font-mono text-text-tertiary bg-surface-subtle px-1.5 py-0.5 rounded shrink-0">
                          {proj.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge className={`text-[10px] border ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{progress}%</span>
                    </div>
                  </div>

                  <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressColor(progress)}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  {proj.endDate && (
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Due:{" "}
                      {new Date(proj.endDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
