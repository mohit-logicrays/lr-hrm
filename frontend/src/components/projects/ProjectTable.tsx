"use client";

import Link from "next/link";
import type { Project } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderKanban, Pencil, Trash2, Calendar, UserCheck } from "lucide-react";

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export function ProjectTable({
  projects,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  return (
    <Card className="border border-border-base bg-surface shadow-2xs rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-subtle/50">
            <TableHead className="font-bold text-xs uppercase">Project</TableHead>
            <TableHead className="font-bold text-xs uppercase">Status</TableHead>
            <TableHead className="font-bold text-xs uppercase">Priority</TableHead>
            <TableHead className="font-bold text-xs uppercase">Progress</TableHead>
            <TableHead className="font-bold text-xs uppercase">Project Manager</TableHead>
            <TableHead className="font-bold text-xs uppercase">Team</TableHead>
            <TableHead className="font-bold text-xs uppercase">Due Date</TableHead>
            <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 w-full bg-surface-subtle animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-xs text-text-tertiary">
                No projects found.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((p) => {
              const pm = p.projectManager;
              const members = p.members || [];
              const progress = p.progress ?? 0;

              return (
                <TableRow key={p.id} className="hover:bg-surface-subtle/40 group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-xs text-text-primary font-heading group-hover:text-brand transition-colors block"
                        >
                          {p.name}
                        </Link>
                        <span className="text-[10px] text-text-tertiary font-mono">
                          {p.code || "PROJ"} · {p.department?.name || "General"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand/10 text-brand">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      {p.status.replace("_", " ")}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                      {p.priority || "MEDIUM"}
                    </Badge>
                  </TableCell>

                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary">{progress}%</span>
                      <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[10px]">
                        {pm ? `${pm.firstName?.[0] || ""}${pm.lastName?.[0] || ""}` : "PM"}
                      </div>
                      <span className="text-xs font-medium text-text-primary">
                        {pm ? `${pm.firstName} ${pm.lastName}` : "Unassigned"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className="text-[11px] text-text-tertiary">{members.length} members</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-text-secondary font-mono">
                    {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/projects/${p.id}`}>
                          <FolderKanban className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {canUpdate && (
                        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon-sm" className="text-error" onClick={() => onDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
