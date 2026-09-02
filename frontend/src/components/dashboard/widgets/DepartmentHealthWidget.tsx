"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";
import { api, type Department } from "@/lib/api";

const COLORS = [
  "bg-brand",
  "bg-info",
  "bg-success",
  "bg-warning",
  "bg-error",
  "bg-purple-500",
  "bg-pink-500",
];

export interface DepartmentHealthWidgetProps {
  limit?: number;
  title?: string;
  variants?: Variants;
}

/**
 * Horizontal bar chart showing member headcount per department.
 * Used on Superadmin dashboard.
 */
export function DepartmentHealthWidget({
  limit = 7,
  title = "Department Overview",
  variants,
}: DepartmentHealthWidgetProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDepartments(1, 50, "")
      .then((res) => setDepartments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxCount = Math.max(...departments.map((d) => d._count?.users || 0), 1);

  return (
    <motion.div variants={variants} className="h-full">
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs h-full">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="h-5 w-5 text-brand" />
          <h2 className="font-heading font-bold text-base text-text-primary">{title}</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-surface-subtle rounded-lg animate-pulse" />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-text-tertiary">No departments found.</p>
        ) : (
          <div className="space-y-4">
            {departments.slice(0, limit).map((dept, idx) => {
              const count = dept._count?.users || 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={dept.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-text-primary">{dept.name}</span>
                    <span className="text-xs text-text-tertiary font-mono tabular-nums">
                      {count} {count === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${COLORS[idx % COLORS.length]}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
