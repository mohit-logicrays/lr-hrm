"use client";

import { Bell, AlertCircle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NotificationStatsBarProps {
  total: number;
  unread: number;
  read: number;
  onPage: number;
}

const STATS = (total: number, unread: number, read: number, onPage: number) => [
  {
    label: "Total",
    value: total,
    Icon: Bell,
    color: "brand",
  },
  {
    label: "Unread",
    value: unread,
    Icon: AlertCircle,
    color: "warning",
  },
  {
    label: "Read",
    value: read,
    Icon: CheckCircle2,
    color: "success",
  },
  {
    label: "This Page",
    value: onPage,
    Icon: SlidersHorizontal,
    color: "text-tertiary",
  },
];

export function NotificationStatsBar({
  total,
  unread,
  read,
  onPage,
}: NotificationStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS(total, unread, read, onPage).map(({ label, value, Icon, color }) => (
        <Card
          key={label}
          className={cn(
            "p-4 border border-border-base bg-surface shadow-2xs rounded-2xl flex flex-col justify-between hover:border-brand/30 transition-all"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-wider",
              color === "brand" && "text-text-tertiary",
              color === "warning" && "text-warning",
              color === "success" && "text-success",
              color === "text-tertiary" && "text-text-tertiary",
            )}>
              {label}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold",
              color === "brand" && "bg-brand/10 text-brand",
              color === "warning" && "bg-warning/10 text-warning",
              color === "success" && "bg-success/10 text-success",
              color === "text-tertiary" && "bg-text-tertiary/10 text-text-tertiary",
            )}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-text-primary font-heading">{value}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
