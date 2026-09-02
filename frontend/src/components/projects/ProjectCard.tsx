"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Calendar,
  Code,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
  UsersRound,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export function ProjectCard({
  project,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const members = project.members || [];
  const pm = project.projectManager;
  const progress = project.progress ?? 0;
  const taskCount = project._count?.tasks ?? 0;

  const priorityColor =
    project.priority === "CRITICAL" || project.priority === "HIGH"
      ? "bg-error/10 text-error border-error/20"
      : project.priority === "MEDIUM"
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-success/10 text-success border-success/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-surface rounded-xl p-5 border border-border-base shadow-2xs hover:shadow-md hover:border-brand/30 transition-all flex flex-col justify-between group relative overflow-hidden h-full"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-brand transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <Link
                href={`/projects/${project.id}`}
                className="font-bold text-base text-text-primary font-heading line-clamp-1 group-hover:text-brand transition-colors"
              >
                {project.name}
              </Link>
              <p className="text-[11px] text-text-tertiary font-mono">
                {project.code || "PROJ"} · {project.department?.name || "General"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-text-tertiary hover:text-text-primary h-7 w-7 opacity-80 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`} className="cursor-pointer">
                  <FolderKanban className="h-3.5 w-3.5 mr-2 text-text-tertiary" /> View Board
                </Link>
              </DropdownMenuItem>
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(project)} className="cursor-pointer">
                  <Pencil className="h-3.5 w-3.5 mr-2 text-text-tertiary" /> Edit Details
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(project)} className="text-error cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status & Priority Pills */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            {project.status.replace("_", " ")}
          </span>

          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ml-auto", priorityColor)}>
            {project.priority || "MEDIUM"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 space-y-1.5">
          <div className="flex justify-between items-end text-xs">
            <span className="text-[11px] font-medium text-text-tertiary">Progress</span>
            <span className="font-bold text-xs text-text-primary font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
            <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border-base/50 flex flex-col justify-end gap-3 mt-auto">
        <div className="flex items-center justify-between gap-2">
          {/* PM Avatar */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-1">
              Project Manager
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[10px]">
                {pm ? `${pm.firstName?.[0] || ""}${pm.lastName?.[0] || ""}` : "PM"}
              </div>
              <span className="text-xs font-semibold text-text-primary truncate max-w-[100px]">
                {pm ? `${pm.firstName} ${pm.lastName}` : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Members Stack */}
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-1">
              Team ({members.length})
            </p>
            <div className="flex -space-x-1.5 justify-end">
              {members.slice(0, 3).map((m, i) => (
                <div
                  key={m.id || i}
                  className="w-6 h-6 rounded-full bg-surface-subtle border-2 border-surface flex items-center justify-center text-[9px] font-bold font-mono text-text-primary"
                  title={`${m.user.firstName} ${m.user.lastName}`}
                >
                  {m.user.firstName?.[0] || "U"}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-surface-subtle border-2 border-surface flex items-center justify-center text-[9px] font-bold font-mono text-text-tertiary">
                  +{members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Due Date & Open Link */}
        <div className="flex items-center justify-between text-text-tertiary pt-2 border-t border-border-base/30 text-xs">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-brand" />
            <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "No Due Date"}</span>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-0.5"
          >
            Open Project &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
