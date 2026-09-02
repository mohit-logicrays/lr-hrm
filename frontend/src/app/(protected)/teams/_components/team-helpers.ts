import {
  Terminal,
  Cpu,
  Store,
  Layers,
  Sparkles,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/lib/api";

export type SortOption = "name-asc" | "name-desc" | "members-desc" | "projects-desc";
export type StatusFilter = "all" | "active" | "inactive";
export type ViewMode = "grid" | "table";

export function memberName(u: { firstName?: string; lastName?: string; email: string }) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

// Icon mapper for cards to add visual flair
const CATEGORY_ICONS = [Terminal, Cpu, Store, Layers, Sparkles, FolderKanban];
const COLOR_ACCENTS = [
  "bg-info/10 text-info border-info/20",
  "bg-brand/10 text-brand border-brand/20",
  "bg-warning/10 text-warning border-warning/20",
  "bg-success/10 text-success border-success/20",
];

export function getCategoryIcon(index: number): LucideIcon {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}

export function getColorAccent(index: number) {
  return COLOR_ACCENTS[index % COLOR_ACCENTS.length];
}

export function isUserAddable(u: User, memberIds: Set<string>) {
  return !memberIds.has(u.id);
}