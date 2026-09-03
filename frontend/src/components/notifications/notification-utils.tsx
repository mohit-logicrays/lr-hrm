"use client";

import {
  Bell,
  CalendarDays,
  Clock,
  FolderKanban,
  CheckSquare,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Home,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { type NotificationItem } from "@/lib/api";

// ── Type Helpers ──────────────────────────────────────────────────────────────

export function getTypeLabel(type: string): string {
  switch (type?.toLowerCase()) {
    case "leave":        return "Leave";
    case "timesheet":    return "Timesheet";
    case "project":      return "Project";
    case "task":         return "Task";
    case "support":      return "Support";
    case "announcement": return "Announcement";
    case "policy":       return "Policy";
    case "wfh":          return "Work From Home";
    case "attendance":   return "Attendance";
    case "user":         return "Account";
    case "system":       return "System";
    default:             return "Notification";
  }
}

export function getTypeIcon(type: string, className = "h-5 w-5") {
  switch (type?.toLowerCase()) {
    case "leave":        return <CalendarDays className={`${className} text-brand`} />;
    case "timesheet":    return <Clock className={`${className} text-warning`} />;
    case "project":      return <FolderKanban className={`${className} text-info`} />;
    case "task":         return <CheckSquare className={`${className} text-success`} />;
    case "support":      return <LifeBuoy className={`${className} text-error`} />;
    case "announcement": return <Megaphone className={`${className} text-warning`} />;
    case "policy":       return <ScrollText className={`${className} text-info`} />;
    case "wfh":          return <Home className={`${className} text-success`} />;
    case "attendance":   return <UserCheck className={`${className} text-brand`} />;
    case "system":       return <AlertTriangle className={`${className} text-warning`} />;
    default:             return <Bell className={`${className} text-brand`} />;
  }
}

export function getTypeIconBg(type: string): string {
  switch (type?.toLowerCase()) {
    case "leave":        return "bg-brand/10 border-brand/20";
    case "timesheet":    return "bg-warning/10 border-warning/20";
    case "project":      return "bg-info/10 border-info/20";
    case "task":         return "bg-success/10 border-success/20";
    case "support":      return "bg-error/10 border-error/20";
    case "announcement": return "bg-warning/10 border-warning/20";
    case "policy":       return "bg-info/10 border-info/20";
    case "wfh":          return "bg-success/10 border-success/20";
    case "system":       return "bg-warning/10 border-warning/20";
    default:             return "bg-brand/10 border-brand/20";
  }
}

// ── Date Grouping Helpers ─────────────────────────────────────────────────────

export function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

export type DateGroup = "Today" | "Yesterday" | "Earlier";

export function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const d = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  if (d >= todayStart) return "Today";
  if (d >= yesterdayStart) return "Yesterday";
  return "Earlier";
}

export function groupNotificationsByDate(items: NotificationItem[]): {
  group: DateGroup;
  items: NotificationItem[];
}[] {
  const groups: Record<DateGroup, NotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const item of items) {
    groups[getDateGroup(item.createdAt)].push(item);
  }

  return (["Today", "Yesterday", "Earlier"] as DateGroup[])
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, items: groups[g] }));
}

export const NOTIFICATION_CATEGORIES = [
  { value: "" as string,   label: "All" },
  { value: "announcement", label: "Announcements" },
  { value: "policy",       label: "Policies" },
  { value: "leave",        label: "Leave" },
  { value: "wfh",          label: "Work From Home" },
  { value: "timesheet",    label: "Timesheet" },
  { value: "project",      label: "Projects" },
  { value: "task",         label: "Tasks" },
  { value: "support",      label: "Support" },
  { value: "system",       label: "System" },
];
