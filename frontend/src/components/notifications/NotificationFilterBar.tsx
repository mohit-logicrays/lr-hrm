"use client";

import { NOTIFICATION_CATEGORIES } from "./notification-utils";
import { cn } from "@/lib/utils";

interface NotificationFilterBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  unreadCount: number;
}

const DATE_RANGES = [
  { value: "7",  label: "Date Range: Last 7 Days" },
  { value: "1",  label: "Today" },
  { value: "30", label: "Last 30 Days" },
  { value: "0",  label: "All Time" },
];

const PRIORITIES = [
  { value: "",         label: "Priority: All" },
  { value: "critical", label: "Critical Only" },
  { value: "high",     label: "High" },
  { value: "normal",   label: "Normal" },
];

export function NotificationFilterBar({
  activeTab,
  onTabChange,
  dateRange,
  onDateRangeChange,
  priority,
  onPriorityChange,
  unreadCount,
}: NotificationFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 bg-surface-subtle border border-border-base p-3 rounded-xl shadow-2xs">
      {/* ── Row 1: Tab Pills — flex-wrap so they spill to a 2nd line if needed ── */}
      <div className="flex items-center flex-wrap gap-1">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onTabChange(cat.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                isActive
                  ? "bg-brand text-white shadow-2xs font-semibold"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              )}
            >
              {cat.label}
              {/* Unread badge only on "All" tab */}
              {cat.value === "" && unreadCount > 0 && !isActive && (
                <span className="px-1.5 py-0.5 bg-brand text-white text-[9px] rounded-full font-bold leading-none">
                  {unreadCount}
                </span>
              )}
              {/* Unread badge on "unread" tab if it exists */}
              {cat.value === "unread" && unreadCount > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded-full font-bold leading-none",
                  isActive ? "bg-white/30 text-white" : "bg-brand text-white"
                )}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Row 2: Dropdowns — always below pills, with a separator ── */}
      <div className="flex items-center gap-3 border-t border-border-base/60 pt-2">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="appearance-none bg-surface px-3 py-1.5 pr-7 rounded-lg text-sm text-text-primary shadow-2xs border border-border-base focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">▾</span>
        </div>

        <div className="relative">
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="appearance-none bg-surface px-3 py-1.5 pr-7 rounded-lg text-sm text-text-primary shadow-2xs border border-border-base focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">▾</span>
        </div>
      </div>
    </div>
  );
}
