"use client";

import { createElement } from "react";
import { motion } from "framer-motion";
import type { Team } from "@/lib/api";
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
  Building2,
  FolderKanban,
  UsersRound,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { getCategoryIcon, getColorAccent } from "./team-helpers";
import { cardVariants } from "./motion";

export function TeamCard({
  team,
  index,
  perms,
  onOpenDetail,
  onEdit,
  onDelete,
}: {
  team: Team;
  index: number;
  perms: { update: boolean; delete: boolean };
  onOpenDetail: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}) {
  const IconComponent = getCategoryIcon(index);
  const accentClass = getColorAccent(index);
  const memberCount = team._count?.members ?? 0;
  const projectCount = team._count?.projects ?? 0;
  const isActive = memberCount > 0;

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -3 }} className="h-full">
      <CardShell>
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${accentClass}`}
              >
                {createElement(IconComponent, { className: "h-4 w-4" })}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text-primary transition-colors group-hover:text-brand font-heading text-sm line-clamp-1 leading-snug">
                  {team.name}
                </h3>
                <p className="text-[11px] text-text-tertiary line-clamp-1">
                  {team.department?.name ?? "No Department"}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Team actions"
                  className="text-text-tertiary hover:text-text-primary hover:bg-surface-subtle rounded-md h-6 w-6 shrink-0"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onOpenDetail(team)} className="gap-1.5 text-xs cursor-pointer">
                  <UsersRound className="h-3.5 w-3.5 text-text-tertiary" /> View Roster
                </DropdownMenuItem>
                {perms.update && (
                  <DropdownMenuItem onClick={() => onEdit(team)} className="gap-1.5 text-xs cursor-pointer">
                    <Pencil className="h-3.5 w-3.5 text-text-tertiary" /> Edit Team
                  </DropdownMenuItem>
                )}
                {perms.delete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(team)}
                      variant="destructive"
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Team
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="min-h-[2.5rem] mb-2.5">
            <div className="line-clamp-3 overflow-hidden">
              <RichTextViewer content={team.description} />
            </div>
            {team.description && team.description.length > 80 && (
              <button
                onClick={() => onOpenDetail(team)}
                className="mt-0.5 text-[10px] font-medium text-brand hover:underline inline-flex items-center gap-0.5"
              >
                See full description &rarr;
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium border ${
                isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-surface-subtle text-text-tertiary border-border-base"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-success" : "bg-text-tertiary"
                }`}
              />
              {isActive ? "Active" : "Inactive"}
            </span>

            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <UsersRound className="h-3.5 w-3.5 text-text-tertiary" />
                {memberCount} {memberCount === 1 ? "Member" : "Members"}
              </span>
              <span className="flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5 text-text-tertiary" />
                {projectCount} {projectCount === 1 ? "Project" : "Projects"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-border-base flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
            <Building2 className="h-3.5 w-3.5 text-text-tertiary" />
            {team.department?.code || "DEPT"}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetail(team)}
            className="text-xs h-6 px-2 text-brand hover:text-brand-hover hover:bg-brand-soft gap-1 font-medium"
          >
            Manage Roster &rarr;
          </Button>
        </div>
      </CardShell>
    </motion.div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border-base bg-surface p-3.5 transition-all duration-200 hover:border-brand/30 hover:shadow-xs flex flex-col justify-between h-full">
      {children}
    </div>
  );
}