"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Holiday } from "@/lib/api";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingHolidaysWidgetProps {
  holidays: Holiday[];
}

export function UpcomingHolidaysWidget({ holidays }: UpcomingHolidaysWidgetProps) {
  return (
    <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-border-base pb-2">
        <h4 className="font-bold text-xs font-heading text-text-primary uppercase tracking-wider">
          Upcoming Holidays
        </h4>
        <span className="text-[10px] text-brand font-semibold">Next 60 Days</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
        {holidays.length === 0 ? (
          <p className="text-xs text-text-tertiary">No upcoming holidays scheduled.</p>
        ) : (
          holidays.map((h) => {
            const hDate = new Date(h.date);
            const monthStr = hDate.toLocaleDateString(undefined, { month: "short" });
            const dayNum = hDate.getDate();

            return (
              <div
                key={h.id}
                className="p-2.5 rounded-lg border border-border-base bg-surface-subtle/30 hover:bg-surface-subtle/60 transition-colors flex items-center gap-3 group"
              >
                {/* Date Badge Box */}
                <div
                  className={cn(
                    "w-10 h-12 rounded-lg border flex flex-col items-center justify-center shrink-0 font-mono shadow-2xs transition-colors",
                    h.type === "NATIONAL" && "bg-brand/10 border-brand/30 text-brand",
                    h.type === "RESTRICTED" && "bg-warning/10 border-warning/30 text-warning",
                    h.type === "COMPANY" && "bg-info/10 border-info/30 text-info"
                  )}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider">{monthStr}</span>
                  <span className="text-base font-extrabold leading-none">{dayNum}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                    {h.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 py-0 font-bold uppercase",
                        h.type === "NATIONAL" && "bg-brand/10 text-brand border-brand/20",
                        h.type === "RESTRICTED" && "bg-warning/10 text-warning border-warning/20",
                        h.type === "COMPANY" && "bg-info/10 text-info border-info/20"
                      )}
                    >
                      {h.type}
                    </Badge>
                    {h.isOptional && (
                      <span className="text-[9px] font-semibold text-text-tertiary">· Optional</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
