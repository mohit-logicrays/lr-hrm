"use client";

import { createElement } from "react";
import { motion } from "framer-motion";
import type { Team } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderKanban,
  UsersRound,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { getCategoryIcon, getColorAccent } from "./team-helpers";
import { fadeInUp } from "./motion";

export function TeamTable({
  teams,
  perms,
  onOpenDetail,
  onEdit,
  onDelete,
}: {
  teams: Team[];
  perms: { update: boolean; delete: boolean };
  onOpenDetail: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}) {
  return (
    <div className="rounded-lg border border-border-base bg-surface shadow-2xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-subtle/50">
            <TableHead className="font-semibold text-text-primary text-xs">Team</TableHead>
            <TableHead className="font-semibold text-text-primary text-xs">Department</TableHead>
            <TableHead className="font-semibold text-text-primary text-xs">Status</TableHead>
            <TableHead className="font-semibold text-text-primary text-xs">Members</TableHead>
            <TableHead className="font-semibold text-text-primary text-xs">Projects</TableHead>
            <TableHead className="text-right font-semibold text-text-primary text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, idx) => {
            const memberCount = team._count?.members ?? 0;
            const projectCount = team._count?.projects ?? 0;
            const isActive = memberCount > 0;
            const IconComponent = getCategoryIcon(idx);
            const accentClass = getColorAccent(idx);

            return (
              <motion.tr
                key={team.id}
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                className="hover:bg-surface-subtle/40"
              >
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${accentClass}`}
                    >
                      {createElement(IconComponent, { className: "h-3.5 w-3.5" })}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary font-heading text-xs">
                        {team.name}
                      </span>
                      {team.description ? (
                        <div className="line-clamp-1 text-[11px]">
                          <RichTextViewer content={team.description} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-2.5">
                  {team.department ? (
                    <Badge variant="outline" className="text-[11px] font-normal rounded-xs px-1.5 py-0">
                      {team.department.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-text-tertiary">&mdash;</span>
                  )}
                </TableCell>

                <TableCell className="py-2.5">
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
                </TableCell>

                <TableCell className="py-2.5 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <UsersRound className="h-3.5 w-3.5 text-text-tertiary" />
                    {memberCount}
                  </span>
                </TableCell>

                <TableCell className="py-2.5 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5 text-text-tertiary" />
                    {projectCount}
                  </span>
                </TableCell>

                <TableCell className="py-2.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Actions"
                        className="text-text-tertiary hover:text-text-primary rounded-md h-6 w-6"
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
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}