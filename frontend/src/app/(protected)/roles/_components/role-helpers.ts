import { UsersRound, FolderKanban, Building2, Calendar, Clock, Shield } from "lucide-react";

export type ViewMode = "grid" | "list";

// Helper to generate initials from role name or display name
export function getRoleInitials(displayName: string, name: string): string {
  if (name.toLowerCase() === "super_admin" || name.toLowerCase() === "admin") return "SA";
  if (name.toLowerCase() === "hr" || displayName.toLowerCase().includes("hr")) return "HR";
  if (name.toLowerCase() === "manager" || displayName.toLowerCase().includes("manager")) return "MG";
  if (name.toLowerCase() === "team_lead" || displayName.toLowerCase().includes("lead")) return "TL";
  if (name.toLowerCase() === "member" || displayName.toLowerCase().includes("member")) return "TM";

  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

// Avatar color accent generator for roles
export function getRoleAvatarColor(name: string, isSpecial?: boolean, isSystem?: boolean) {
  if (isSpecial) return "bg-primary-container text-on-primary-container border-primary/30";
  if (name.includes("hr")) return "bg-secondary-container text-on-secondary-container border-secondary/30";
  if (name.includes("manager")) return "bg-info/10 text-info border-info/20";
  if (name.includes("lead")) return "bg-warning/10 text-warning border-warning/20";
  if (isSystem) return "bg-surface-subtle text-text-primary border-border-base";
  return "bg-brand/10 text-brand border-brand/20";
}

// Module Icon Mapper
export function getModuleIcon(groupName: string) {
  const name = groupName.toLowerCase();
  if (name.includes("user") || name.includes("employee")) return UsersRound;
  if (name.includes("project") || name.includes("task")) return FolderKanban;
  if (name.includes("team") || name.includes("department")) return Building2;
  if (name.includes("leave") || name.includes("attendance") || name.includes("holiday")) return Calendar;
  if (name.includes("time") || name.includes("schedule")) return Clock;
  return Shield;
}