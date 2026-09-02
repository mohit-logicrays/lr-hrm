"use client";

import { createElement } from "react";
import { motion } from "framer-motion";
import type { Department } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  Building2,
  Code,
  Cpu,
  MoreVertical,
  Palette,
  Pencil,
  Server,
  ShoppingCart,
  Terminal,
  Trash2,
  UsersRound,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentCardProps {
  department: Department;
  index: number;
  perms: { update: boolean; delete: boolean };
  onEdit: (d: Department) => void;
  onDelete: (d: Department) => void;
}

// Icon and color accent mapping matching TeamCard helpers
function getDepartmentIconAndAccent(name: string, code: string, index: number) {
  const key = `${name} ${code}`.toLowerCase();

  const accents = [
    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
    "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
    "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  ];

  const accentClass = accents[index % accents.length];

  if (key.includes("py") || key.includes("python")) return { icon: Code, accentClass };
  if (key.includes("ai") || key.includes("ml") || key.includes("data")) return { icon: Brain, accentClass };
  if (key.includes("shop") || key.includes("ecom") || key.includes("cart")) return { icon: ShoppingCart, accentClass };
  if (key.includes("front") || key.includes("fe") || key.includes("react")) return { icon: Terminal, accentClass };
  if (key.includes("back") || key.includes("be") || key.includes("node")) return { icon: Server, accentClass };
  if (key.includes("devops") || key.includes("cloud") || key.includes("sys")) return { icon: Cpu, accentClass };
  if (key.includes("design") || key.includes("ui") || key.includes("ux")) return { icon: Palette, accentClass };
  if (key.includes("qa") || key.includes("test")) return { icon: CheckCircle2, accentClass };

  return { icon: Building2, accentClass };
}

export function DepartmentCard({
  department,
  index,
  perms,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  const { icon: IconComponent, accentClass } = getDepartmentIconAndAccent(department.name, department.code, index);
  const teamsCount = department._count?.teams ?? 0;
  const usersCount = department._count?.users ?? 0;
  const isActive = usersCount > 0 || teamsCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      <div className="group relative overflow-hidden rounded-lg border border-border-base bg-surface p-3.5 transition-all duration-200 hover:border-brand/30 hover:shadow-xs flex flex-col justify-between h-full">
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border", accentClass)}>
                {createElement(IconComponent, { className: "h-4 w-4" })}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text-primary transition-colors group-hover:text-brand font-heading text-sm line-clamp-1 leading-snug">
                  {department.name}
                </h3>
                <p className="text-[11px] text-text-tertiary line-clamp-1 font-mono">
                  DPT-{department.code}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Department actions"
                  className="text-text-tertiary hover:text-text-primary hover:bg-surface-subtle rounded-md h-6 w-6 shrink-0"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {perms.update && (
                  <DropdownMenuItem onClick={() => onEdit(department)} className="gap-1.5 text-xs cursor-pointer">
                    <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Department
                  </DropdownMenuItem>
                )}
                {perms.delete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(department)}
                      variant="destructive"
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Department
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <div className="min-h-[2.5rem] mb-2.5">
            <div className="line-clamp-3 overflow-hidden">
              <RichTextViewer content={department.description} />
            </div>
            {department.description && department.description.length > 80 && (
              <button
                onClick={() => onEdit(department)}
                className="mt-0.5 text-[10px] font-medium text-brand hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                See full description &rarr;
              </button>
            )}
          </div>

          {/* Status & Counts Bar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium border",
                isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-surface-subtle text-text-tertiary border-border-base"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-success" : "bg-text-tertiary")} />
              {isActive ? "Active" : "Inactive"}
            </span>

            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-text-tertiary" />
                {teamsCount} {teamsCount === 1 ? "Team" : "Teams"}
              </span>
              <span className="flex items-center gap-1">
                <UsersRound className="h-3.5 w-3.5 text-text-tertiary" />
                {usersCount} {usersCount === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-2.5 border-t border-border-base flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-text-secondary font-medium font-mono">
            <Building2 className="h-3.5 w-3.5 text-text-tertiary" />
            {department.code}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(department)}
            className="text-xs h-6 px-2 text-brand hover:text-brand-hover hover:bg-brand-soft gap-1 font-medium"
          >
            Manage Department &rarr;
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
