"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export interface TeamStat {
  label: string;
  value: string | number;
  color?: string;
}

export interface TeamQuickStatsWidgetProps {
  stats: TeamStat[];
  title?: string;
  variants?: Variants;
}

/**
 * Simple key-value stat list for Team Lead dashboard.
 * Fully data-driven.
 */
export function TeamQuickStatsWidget({
  stats,
  title = "Team Quick Stats",
  variants,
}: TeamQuickStatsWidgetProps) {
  return (
    <motion.div variants={variants} className="h-full">
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs h-full">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-5 w-5 text-info" />
          <h2 className="font-heading font-bold text-base text-text-primary">{title}</h2>
        </div>
        <div className="space-y-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle"
            >
              <span className="text-xs font-semibold text-text-secondary">{s.label}</span>
              <span className={`text-sm font-extrabold font-heading ${s.color ?? "text-text-primary"}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
