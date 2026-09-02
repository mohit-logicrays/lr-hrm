"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { api, type LeaveBalance } from "@/lib/api";

export interface LeaveBalanceWidgetProps {
  /** Max number of leave types to show. Default 5. */
  limit?: number;
  variants?: Variants;
}

/**
 * Displays the current user's leave balance as labelled progress bars.
 */
export function LeaveBalanceWidget({ limit = 5, variants }: LeaveBalanceWidgetProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaveBalance()
      .then((res) => setBalances(res.data?.balances || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div variants={variants} className="h-full">
      <Card className="p-6 bg-surface border border-border-base rounded-2xl shadow-2xs h-full">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="h-5 w-5 text-info" />
          <h2 className="font-heading font-bold text-base text-text-primary">Leave Balances</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-32 bg-surface-subtle rounded animate-pulse" />
                <div className="h-2 bg-surface-subtle rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <p className="text-sm text-text-tertiary">No leave balances found.</p>
        ) : (
          <div className="space-y-4">
            {balances.slice(0, limit).map((b) => {
              const remaining = b.allocated - b.used;
              const pct = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-text-primary">
                      {b.leaveType?.name || "Leave"}
                    </span>
                    <span className="text-text-tertiary tabular-nums">
                      {remaining} / {b.allocated} left
                    </span>
                  </div>
                  <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
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
