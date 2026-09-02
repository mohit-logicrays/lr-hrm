"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { type Project, type ProjectStatus } from "@/lib/api";

const STATUS_CONFIGS: {
  status: ProjectStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { status: "ACTIVE", label: "Active", color: "text-success", bg: "bg-success/5 border-success/20" },
  { status: "PLANNING", label: "Planning", color: "text-info", bg: "bg-info/5 border-info/20" },
  { status: "ON_HOLD", label: "On Hold", color: "text-warning", bg: "bg-warning/5 border-warning/20" },
  { status: "COMPLETED", label: "Completed", color: "text-text-primary", bg: "bg-surface-subtle border-border-base" },
  { status: "ARCHIVED", label: "Archived", color: "text-text-tertiary", bg: "bg-surface-subtle border-border-base" },
];

export interface ProjectStatusGridWidgetProps {
  projects: Project[];
  loading?: boolean;
  variants?: Variants;
}

/**
 * A 5-column grid showing project count grouped by status.
 * Used on Superadmin dashboard.
 */
export function ProjectStatusGridWidget({
  projects,
  loading = false,
  variants,
}: ProjectStatusGridWidgetProps) {
  return (
    <motion.div variants={variants}>
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="h-5 w-5 text-brand" />
          <h2 className="font-heading font-bold text-base text-text-primary">Projects by Status</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-surface-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STATUS_CONFIGS.map(({ status, label, color, bg }) => {
              const count = projects.filter((p) => p.status === status).length;
              return (
                <div key={status} className={`p-4 rounded-xl border ${bg} text-center`}>
                  <p className={`text-2xl font-extrabold font-heading ${color}`}>{count}</p>
                  <p className="text-xs text-text-tertiary mt-1">{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
